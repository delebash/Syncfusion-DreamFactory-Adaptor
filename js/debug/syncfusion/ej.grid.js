/*!
*  filename: ej.grid.js
*  version : 14.2.0.26
*  Copyright Syncfusion Inc. 2001 - 2016. All rights reserved.
*  Use of this code is subject to the terms of our license.
*  A copy of the current license can be obtained at any time by e-mailing
*  licensing@syncfusion.com. Any infringement will be prosecuted under
*  applicable laws. 
*/
(function (fn) {
    typeof define === 'function' && define.amd ? define(["jquery-easing","./../common/ej.globalize","jsrender","./../common/ej.core","./../common/ej.data","./../common/ej.touch","./../common/ej.draggable","./../common/ej.scroller","./ej.button","./ej.checkbox","./ej.menu","./ej.waitingpopup","./ej.radiobutton","./ej.autocomplete","./ej.datepicker","./ej.datetimepicker","./ej.dropdownlist","./ej.dialog","./ej.editor","./ej.pager","./ej.toolbar","./ej.excelfilter"], fn) : fn();
})
(function () {
	
(function ($, ej, undefined) {
    ej.gridFeatures = ej.gridFeatures || {};
    ej.gridFeatures.common = {
        
        refreshContent: function (refreshTemplate) {
            if (refreshTemplate) {
                this.refreshTemplate();
                this._refreshHeader();
            }
            var args = {};
            this._initialRenderings();
            args.requestType = ej.Grid.Actions.Refresh;
            this._processBindings(args);
        },

        
        rowHeightRefresh: function () {
            if (this.model.scrollSettings.frozenColumns > 0 && !ej.isNullOrUndefined(this.model.currentViewData) && this.model.currentViewData.length) {
                var frozenRows = this.getContentTable().get(0).rows;
                var movableRows = this.getContentTable().get(1).rows, height = 0;
                if (this.getContent().find(".e-frozencontentdiv").is(":visible"))
                    for (var i = 0; i < frozenRows.length; i++) {
                        if ($(frozenRows[i]).css("display") == "none")
                            continue;
                        height = ej.max([frozenRows[i].getClientRects()[0].height, movableRows[i].getClientRects()[0].height]);
                        $(frozenRows[i]).height(height); $(movableRows[i]).height(height);
                        if (i && (i == this.model.scrollSettings.frozenRows - 1 || i == frozenRows.length - 1))
                            height = height + 1;
                        if (!this.model.allowTextWrap) {
                            if (!i || i == this.model.scrollSettings.frozenRows - 1)
                                height = height - 1;
                        }
                        if (this.model.isEdit && $(frozenRows[i]).find("#" + this._id + "EditForm").length && i)
                            $(frozenRows[i]).find("#" + this._id + "EditForm td").css("height", height); $(movableRows[i]).find("#" + this._id + "EditForm td").css("height", height);
                    }
                this._getRowHeights()
                if (!ej.isNullOrUndefined(this.getContent().data("ejScroller")) && (this.getScrollObject()._vScrollbar != null || this.getScrollObject().isVScroll())) {
                    var scroller = this.getScrollObject()._vScrollbar;
                    if (ej.isNullOrUndefined(scroller) || scroller.value() != scroller.model.maximum)
						this._scrollObject.refresh(this.model.scrollSettings.frozenColumns > 0);                        
                }

            }
        },
                
        dataSource: function (dataSource, templateRefresh) {
            if (templateRefresh)
                this._templateRefresh = true;
            this._dataSource(dataSource);
			if(!this.model.scrollSettings.enableVirtualization){
				if (dataSource.length > 0)
					this._currentPage(1);
				else
					this._currentPage(0);
			}
			this._updateDataSource = true;
			this._refreshDataSource(dataSource);			
            var model = this._refreshVirtualPagerInfo();
            if (this.model.allowPaging || this.model.scrollSettings.allowVirtualScrolling) 
                this._showPagerInformation(model)
            if (this.model.scrollSettings.allowVirtualScrolling) {
				if(this.model.scrollSettings.enableVirtualization && this._isLocalData)
					this._refreshVirtualView(); 
				else
					this._refreshVirtualContent(); 
                if (this.getContent().ejScroller("isHScroll"))
                    this.getContent().ejScroller("scrollX", 0, true);
                if (this.getContent().ejScroller("isVScroll")) {
					if(!this.model.scrollSettings.enableVirtualization)
						this.getContent().ejScroller("scrollY", 0, true);
                    this.element.find(".e-gridheader").addClass("e-scrollcss");
                }
                else
                    this.element.find(".e-gridheader").removeClass("e-scrollcss");
            }
			if(!this.model.scrollSettings.enableVirtualization || this._gridRows.length < this._virtualRowCount)
				this._addLastRow();
			this._trigger("dataBound", {});
        },
        _refreshDataSource: function (dataSource) {
            if (dataSource instanceof ej.DataManager)
                this._dataManager = dataSource;
            else
                this._dataManager = ej.DataManager(dataSource);
            this._isLocalData = (!(this._dataSource() instanceof ej.DataManager) || (this._dataManager.dataSource.offline || this._isRemoteSaveAdaptor));
			if(this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){
				this._refreshVirtualViewData();
				this._virtualDataRefresh = true;	
			}
            this.refreshContent(true);
            if (!ej.isNullOrUndefined(this.getPager())) {
                this.getPager().ejPager("model.currentPage", 1);
                this._refreshGridPager();
            }
        },
        
        hideColumns: function (c) {
            var i, count = 0, args = {}, index, colIndex, newHideCol = []; var htext, field, hiddenFrozenCount = 0;
            htext = typeof (c) == "string" ? this.getColumnByHeaderText(c) : this.getColumnByHeaderText(c[0]);
            field = typeof (c) == "string" ? this.getColumnByField(c) : this.getColumnByField(c[0]);
            
			this._showHideColumns = true;
            var duparr = this._isDuplicate($.merge($.merge([], this._visibleColumns), this._hiddenColumns));
            var hidden = !duparr ? "_hiddenColumns" : "_hiddenColumnsField";
            var visible = !duparr ? "_visibleColumns" : "_visibleColumnsField";
            if (!duparr && field != null) {
                if ($.isArray(c)) {
                    for (var i = 0; i < c.length; i++) {
                        var cfield = this.getColumnByField(c[i]);
                        c[i] = cfield != null ? cfield.headerText : c[i];
                    }
                }
                else
                    c = field.headerText;
            }
            if ($.isArray(c)) {
                for (i = 0; i < c.length; i++) {
                    index = $.inArray(c[i], this[visible]);
                    
                    if (index != -1) {
                        this[hidden].push(c[i]);
                        this[visible].splice(index, 1);
                    }
					else if(index==-1 && visible=="_visibleColumnsField" && $.inArray(c[i],this[hidden])==-1 && ej.isNullOrUndefined(this.getColumnByField(c[i]))){
						this[hidden].push(this.getColumnByHeaderText(c[i]).field) && this["_hiddenColumns"].push(this.getColumnByHeaderText(c[i]).field)
						this[visible].splice($.inArray(this.getColumnByHeaderText(c[i]).field, this[visible]),1) && this["_visibleColumns"].splice($.inArray(c[i], this["_visibleColumns"]),1)
					}
                }
            } else {
                index = $.inArray(c, this[visible]);
                if (index != -1) {
                    this[hidden].push(c);
                    this[visible].splice(index, 1);
                }
				else if(index==-1 && visible=="_visibleColumnsField" && $.inArray(c,this[hidden])==-1 && ej.isNullOrUndefined(this.getColumnByField(c))){
						this[hidden].push(this.getColumnByHeaderText(c).field) && this["_hiddenColumns"].push(this.getColumnByHeaderText(c).field)
						this[visible].splice($.inArray(this.getColumnByHeaderText(c).field, this[visible]),1) && this["_visibleColumns"].splice($.inArray(c, this["_visibleColumns"]),1)
				}
            }
            for (i = 0; i < this.model.columns.length; i++) {
                var com = !duparr ? "headerText" : "field";
                if ($.inArray(ej.isNullOrUndefined(this.model.columns[i][com]) || this.model.columns[i][com] == "" ? this.model.columns[i]["headerText"] : this.model.columns[i][com], this[hidden]) != -1) {
                    this.model.columns[i].visible && newHideCol.push(this.model.columns[i]);
                    this.model.columns[i].visible = false;
                    if (this.model.allowScrolling && this.model.scrollSettings.frozenColumns > 0 && this.model.columns.indexOf(this.model.columns[i]) < this.model.scrollSettings.frozenColumns)
                        hiddenFrozenCount++;
                    count++;
                }
                if (this[hidden].length == count)
                    break;
            }
            args.requestType = "refresh";
            this._hideHeaderColumn(this[hidden], duparr);
            if (this.model.allowScrolling && this.model.scrollSettings.frozenColumns > 0) {
                var $table = this._renderGridHeader();
                this.element.find('.e-gridheader').replaceWith($table[0])
                if (this.model.allowFiltering && this.model.filterSettings.filterType == "filterbar") this._renderFiltering();
                if (this.model.allowReordering)
                   this._headerCellreorderDragDrop();
            }
            this.refreshTemplate();
            if (this.model.scrollSettings.allowVirtualScrolling)
                this._virtualShowHide(args);
            if(this._isAddNew && this.model.isEdit){
                this.model.query = this.commonQuery.clone();
                this._ensureDataSource(args);
                this._isAddNew = false;
            }
            this.sendDataRenderingRequest(args);
            this.rowHeightRefresh();
            if (this.model.allowScrolling) {
                if (this.model.scrollSettings.frozenColumns == 0 && this.getBrowserDetails().browser == "msie") {
                    var tableWidth = this._calculateWidth();
                    this.getHeaderTable().width(tableWidth);
                    this.getContentTable().width(tableWidth);
                }
                if (!ej.isNullOrUndefined(this._scrollObject))
                this.getScrollObject().refresh();
            }
            if (this.model.showColumnChooser)
                this._refreshColumnChooserList();
             if (this.model.allowScrolling && this.model.scrollSettings.frozenColumns > 0) {
				if(hiddenFrozenCount == this.model.scrollSettings.frozenColumns){
				    this._frozenPaneRefresh();
				}				
                 this.getScrollObject().refresh();
             }
			this._showHideColumns = false;
        },
        
        showColumns: function (c) {
            var i, count = 0, args = {}, index, colIndex, column, newVisColumns = []; var htext, field;
            htext = typeof (c) == "string" ? this.getColumnByHeaderText(c) : this.getColumnByHeaderText(c[0]);
            field = typeof (c) == "string" ? this.getColumnByField(c) : this.getColumnByField(c[0]);
            
			this._showHideColumns = true;
            var duparr = this._isDuplicate($.merge($.merge([], this._visibleColumns), this._hiddenColumns));//updated for
            var hidden = !duparr ? "_hiddenColumns" : "_hiddenColumnsField";
            var visible = !duparr ? "_visibleColumns" : "_visibleColumnsField";
            if (!duparr && field != null) {
                if ($.isArray(c)) {
                    for (var i = 0; i < c.length; i++) {
                        var cfield = this.getColumnByField(c[i]);
                        c[i] = cfield != null ? cfield.headerText : c[i];
                    }
                }
                else
                    c = field.headerText;
            }
            if ($.isArray(c)) {
                for (i = 0; i < c.length; i++) {
                    index = $.inArray(c[i], this[hidden]);
                    
                    if (index != -1) {
                        this[hidden].splice(index, 1);
                        this[visible].push(c[i]);
                    }
					else if(index==-1 && hidden=="_hiddenColumnsField" && $.inArray(c[i],this[visible])==-1 && ej.isNullOrUndefined(this.getColumnByField(c[i]))){
						this[visible].push(this.getColumnByHeaderText(c[i]).field) && this["_visibleColumns"].push(c[i])
						this[hidden].splice($.inArray(this.getColumnByHeaderText(c[i]).field, this[hidden]),1) && this["_hiddenColumns"].splice($.inArray(c[i], this["_hiddenColumns"]),1)
					}
                }
            } else {
                index = $.inArray(c, this[hidden]);
                if (index != -1) {
                    this[hidden].splice(index, 1);
                    this[visible].push(c);
                }
				else if(index==-1 && hidden=="_hiddenColumnsField" && $.inArray(c,this[visible])==-1 && ej.isNullOrUndefined(this.getColumnByField(c))){
					this[visible].push(this.getColumnByHeaderText(c).field) && this["_visibleColumns"].push(c)
					this[hidden].splice($.inArray(this.getColumnByHeaderText(c).field, this[hidden]),1) && this["_hiddenColumns"].splice($.inArray(c, this["_hiddenColumns"]),1)
				}
            }
            for (i = 0; i < this.model.columns.length; i++) {
                var com = !duparr ? "headerText" : "field";
                if ($.inArray(ej.isNullOrUndefined(this.model.columns[i][com]) || this.model.columns[i][com] == "" ? this.model.columns[i]["headerText"] : this.model.columns[i][com], this[visible]) != -1) {
                    !this.model.columns[i].visible && newVisColumns.push(this.model.columns[i])
                    this.model.columns[i].visible = true;
                    count++;
                }
                if (this[visible].length == count)
                    break;
            }


            if (this.model.allowScrolling && this.model.scrollSettings.frozenColumns > 0) {
                var frozenHide = false;
                for (var i = 0; i < newVisColumns.length; i++) {
                    var index = this.model.columns.indexOf(newVisColumns[i]);
                    if (index < this.model.scrollSettings.frozenColumns)
                        frozenHide = true;
                }
                if (frozenHide) {
					for(var i = 0; i < this.model.columns.length; i++){
						if($.inArray(this.model.columns[i].headerText, this["_hiddenColumns"]) != -1)
							this.model.columns[i].visible = false;
						else if($.inArray(this.model.columns[i].headerText, this["_visibleColumns"]) != -1)
							this.model.columns[i].visible = true;
					}
                    var $table = this._renderGridHeader();
                    this.element.find('.e-gridheader').replaceWith($table[0])
                    if (this.model.allowFiltering && this.model.filterSettings.filterType == "filterbar") this._renderFiltering();
                    if (this.model.allowReordering)
                        this._headerCellreorderDragDrop();
                }
            }

            args.requestType = "refresh";
            this._showHeaderColumn(this[visible], duparr);

            this.refreshTemplate();
            if (this.model.scrollSettings.allowVirtualScrolling)
                this._virtualShowHide(args);
            if (this._isAddNew && this.model.isEdit) {
                this.model.query = this.commonQuery.clone();
                this._ensureDataSource(args);
                this._isAddNew = false;
            }
            this.sendDataRenderingRequest(args);
            this.rowHeightRefresh();
            if (this.model.allowScrolling && !ej.isNullOrUndefined(this._scrollObject)) {
                this.getScrollObject().refresh();
            }
            if (this.model.showColumnChooser)
                this._refreshColumnChooserList();
			this._showHideColumns = false;
        },
        _virtualShowHide: function (args) {
            this._currentPage(1);
            this.model.query = this.commonQuery.clone();
            this._ensureDataSource(args);
            this._loadedJsonData = [];
            this._prevPage = this._currentPage();
        },
        
        resizeColumns: function (column, width) {
            if (column instanceof Array) {
                for (var i = 0; i < column.length; i++) {
                    var colWidth = width instanceof Array ? width[i] : width;
                    this._setWidthColumnCollection(column[i], colWidth);
                }
            }
            else
                this._setWidthColumnCollection(column, width);
            this.setWidthToColumns();
            if (this.model.scrollSettings.frozenColumns){
                this._frozenAlign();
                this.rowHeightRefresh();
            }
        },
        _setWidthColumnCollection: function (column, width) {
            var col = this.getColumnByHeaderText(column) || this.getColumnByField(column);
            col.width = width;
            if ($.inArray(col.field, this._disabledResizingColumns) == -1)
                this.columnsWidthCollection[$.inArray(col, this.model.columns)] = width;
        },
        
        refreshTemplate: function () {
            this.addInitTemplate();
            if (this.model.editSettings.allowEditing || this.model.editSettings.allowAdding) {
				this._processEditing();
            }
            if (this.model.allowGrouping) this.addGroupingTemplate();
        },
        _refreshHeader: function () {
            var $header = this.element.find(".e-gridheader");
            this.element[0].replaceChild(this._renderGridHeader()[0], $header[0]);
            if (this.model.allowFiltering && this.model.filterSettings.filterType == "filterbar")
                this._renderFiltering();
            this.model.allowGrouping && this._headerCellgDragDrop(); 
            this.model.allowReordering && this._headerCellreorderDragDrop();
            this.model.showColumnChooser && this._renderColumnChooserData(true);
			if(this.model.gridLines != "both")
				this._showHeaderGridLines();
        },
        set_dropColumn: function (from, to) {
            if (this.model.allowReordering && from != to) {
                this.model.columns.splice(to, 0, this.model.columns.splice(from, 1)[0]);
                var columns = this.model.columns;
                var $header = this.getHeaderTable().find(".e-columnheader:last .e-headercell").not(".e-stackedHeaderCell");
                var $headerCell = $header.find(".e-headercelldiv");
                if (!this.model.scrollSettings.frozenColumns)
                    this.getHeaderTable().find("colgroup").replaceWith(this._getMetaColGroup());
                (this.model.detailsTemplate != null || this.model.childGrid != null) && this.getHeaderTable().find("colgroup").prepend(this._getIndentCol());

                //Remove and Returns name/value pair of element attributes
                var removeAttr = function (ele) {
                    var names = []; if (ele == undefined) return;
                    if (["", undefined].indexOf(ele.value) == -1) {
                        names.push({ name: "value", value: ele.value }); ele.value = "";
                    }
                    for (var e = 0, eAttr = ele.attributes, eLen = eAttr.length; e < eLen; e++) {
                        var regex = /^jQuery[0-9]+$/;
                        !eAttr[e].name.match(regex) && names.push({ name: eAttr[e].name, value: eAttr[e].value });
                    }
                    for (var a = 0, aLen = names.length; a < aLen; a++) {
                        $(ele).removeAttr(names[a].name);
                    }
                    return names;
                };
                //Add attributes to the ele
                var addAttr = function (coll, ele) {
                    if (ele == undefined) return;
                    for (var e = 0, eLen = coll.length; e < eLen; e++) {
                        if (coll[e].name == "value") ele.value = coll[e].value;
                        $(ele).attr(coll[e].name, coll[e].value);
                    }
                };

                if (this.getHeaderTable().find(".e-filterdiv").length > 0)
                    var $filterCell = this.getHeaderTable().find(".e-filterdiv input");
                var $fState = ej.isNullOrUndefined($filterCell);
                var $attributeCollection = { "cellattributes": [], "headerattributes": [], "filtercellattributes": [], "filterThattributes": [] };
                var fromIndex = from < to ? from : to;
                var toIndex = from < to ? to : from;
                
                for (var i = fromIndex, j = 0; i <= toIndex; i++) {
                    var hIndx = (this.model.detailsTemplate != null || this.model.childGrid != null) ? i + 1 : i;
                    $attributeCollection.headerattributes[j] = removeAttr($header[hIndx]);
                    $attributeCollection.cellattributes[j] = removeAttr($headerCell[i]);
                    $attributeCollection.filtercellattributes[j] = !$fState ? removeAttr($filterCell[i]) : [];
                    $attributeCollection.filterThattributes[j] = !$fState ? removeAttr($($filterCell[i]).closest("th")[0]) : [];
                    j++;
                }

                var spliceFrom = from < to ? $attributeCollection.cellattributes.length - 1 : 0;
                var spliceTo = from < to ? 0 : $attributeCollection.cellattributes.length - 1;

                for (var prop in $attributeCollection)
                    $attributeCollection[prop].splice(spliceFrom, 0, $attributeCollection[prop].splice(spliceTo, 1)[0]);

                
                for (var i = fromIndex, j = 0; i <= toIndex; i++) {
                    var indx = (this.model.detailsTemplate != null || this.model.childGrid != null) ? i + 1 : i;
                    addAttr($attributeCollection.headerattributes[j], $header[indx]);
                    addAttr($attributeCollection.cellattributes[j], $headerCell[i]);
                    !$fState && addAttr($attributeCollection.filtercellattributes[j], $filterCell[i]);
                    !$fState && addAttr($attributeCollection.filterThattributes[j], $($filterCell[i]).closest("th")[0]);
                    j++;
                }
                if (this.model.allowFiltering && ["menu", "excel"].indexOf(this.model.filterSettings.filterType) != -1) {
                    var col = this.model.columns;
                    $header.find(".e-filtericon").remove();
                    for (var i = 0; i < col.length; i++) {
                        if (col[i]["allowFiltering"] || ej.isNullOrUndefined(col[i]["allowFiltering"])) {
                            var filterHeader = $header.find(".e-headercelldiv[ej-mappingname=" + col[i].field + "]").closest(".e-headercell")
                            filterHeader.append(ej.buildTag('div.e-filtericon e-icon e-filterset'));
                        }
                    }
                    this._refreshFilterIcon();
                }

                this.columnsWidthCollection.splice(to, 0, this.columnsWidthCollection.splice(from, 1)[0]);
                var headerCell;
                this._fieldColumnNames = this._headerColumnNames = [];
                for (var count = 0; count < columns.length; count++) {
                    this._fieldColumnNames[columns[count].headerText] = columns[count].field;
                    this._headerColumnNames[columns[count].field] = columns[count].headerText;
                    headerCell = $($headerCell[count]);
                    if (!ej.isNullOrUndefined(columns[count].headerTemplateID))
                        headerCell.html($(columns[count]["headerTemplateID"]).html());
                    else
                    columns[count].disableHtmlEncode ? headerCell.text(columns[count].headerText) : headerCell.html(columns[count].headerText);
                    if (this.model.groupSettings.showToggleButton && (ej.isNullOrUndefined(columns[count].allowGrouping) || columns[count].allowGrouping)) {
                        if ($.inArray(columns[count].field, this.model.groupSettings.groupedColumns) != -1)
                            headerCell.append(this._getToggleButton().addClass("e-toggleungroup"));
                        else
                            headerCell.append(this._getToggleButton().addClass("e-togglegroup"));
                    }
                }
                if (this.model.allowGrouping && this.model.allowSorting != true) {
                    for (var i = 0; i < this.model.sortSettings.sortedColumns.length; i++)
                        this._addSortElementToColumn(this.model.sortSettings.sortedColumns[i].field, this.model.sortSettings.sortedColumns[i].direction);
                }
                if (this.model.allowSorting) {
                    for (var i = 0; i < this.model.sortSettings.sortedColumns.length; i++) {
                        var opacity = 1;
                        var $sCol = this.model.sortSettings.sortedColumns[i];
                        var sortcolumn = this.getsortColumnByField($sCol.field);
                        var index = this.getColumnIndexByField($sCol.field);
                        var sortindex = $.inArray(sortcolumn, this.model.sortSettings.sortedColumns);
                        imageDirection = $sCol.direction != "descending" ? "e-rarrowup-2x" : "e-rarrowdown-2x";
                        if (this.model.allowMultiSorting) {
                            for (var j = 1; j <= sortindex; j++) {
                                opacity = opacity + 1;
                            }
                            if ($headerCell.eq(index).css("text-align") == "right") {
                                if(this.model.sortSettings.sortedColumns.length > 1)
                                    $headerCell.eq(index).prepend(this._createSortNumber(opacity, $headerCell.eq(index)).addClass("e-sortnumber"));
                                $headerCell.eq(index).append(this._createSortElement().addClass("e-" + ($sCol.direction || "ascending") + " " + imageDirection));
                            }
                            else {
                                $headerCell.eq(index).append(this._createSortElement().addClass("e-" + ($sCol.direction || "ascending") + " " + imageDirection));
                                if (this.model.sortSettings.sortedColumns.length > 1)
                                    $headerCell.eq(index).append(this._createSortNumber(opacity, $headerCell.eq(index)).addClass("e-sortnumber"));
                            }
                        }
                        else {
                            imageDirection = $sCol.direction != "descending" ? "e-rarrowup-2x" : "e-rarrowdown-2x";
                            $headerCell.eq(index).append(this._createSortElement().addClass("e-" + ($sCol.direction || "ascending") + " " + imageDirection));
                        }
                    }
                }
                var args = {};
                args.requestType = ej.Grid.Actions.Reorder;
                this._isReorder = true;
                this.refreshTemplate();
				if(this._isAddNew && this.model.isEdit){
					this.model.query = this.commonQuery.clone();
					this._ensureDataSource(args);
					this._isAddNew = false;
				}
                this.sendDataRenderingRequest(args);
                this._isReorder = false;
            }
        },
        
        getPager: function () {
            return this._gridPager;
        },
        
        getFooterTable: function () {
            return this._gridFooterTable;
        },

        setGridFooterTable: function (value) {
            this._gridFooterTable = value;
        },
        
        getFooterContent: function () {
            return this._gridFooterContent;
        },

        setGridFooterContent: function (value) {
            this._gridFooterContent = value;
        },
        
        getScrollObject: function () {
            if (this._scrollObject == null || ej.isNullOrUndefined(this._scrollObject.model))
                this._scrollObject = this.getContent().ejScroller("instance");
            return this._scrollObject;
        },
        setGridPager: function (value) {
            this._gridPager = value;
        },
        
        getRowHeight: function () {
            var rowHeight = -1;
			if (this.getContentTable() != null) {
				var trColl = this.getContentTable().find('tr:not(.e-virtualrow)'), index = trColl.length > 2 ? 1 : 0;
				if(trColl.length)
					var $trBound = trColl[index].getBoundingClientRect();
				if (trColl.length > 1) {
					if ($trBound && $trBound.height) {
						rowHeight = $trBound.height;
					} else
						rowHeight = trColl[index].offsetHeight;
				}
			}
            return rowHeight == -1 ? 32 : rowHeight;
        },
        
        getCurrentIndex: function () {
            return ((this._currentPage() - 1) * (this.model.pageSettings.pageSize));
        },
        
        getColumnByIndex: function (index) {
            if (index < this.model.columns.length)
                return this.model.columns[index];
            return null;
        },
        set_currentPageIndex: function (val) {
            var pageSetting = this.model.pageSettings;
            var recordCount = this.model.filterSettings.filteredColumns.length == 0 ? this._searchCount == null ? this._gridRecordsCount : this._searchCount : this._filteredRecordsCount;
            if (pageSetting.totalPages == null)
                pageSetting.totalPages = Math.ceil(recordCount / pageSetting.pageSize);
            if (val > pageSetting.totalPages || val < 1 || val == this._currentPage())
                return false;
            if (ej.isNullOrUndefined(this._prevPageNo))
                this._prevPageNo = this._currentPage();
            this._currentPage(val);
            if (this._currentPage() != this._prevPageNo) {
                var args = {};
                args.requestType = "paging";
                this.gotoPage(this._currentPage(), args);
                return true;
            }
            else
                return false;
        },
        set_currentVirtualIndex: function (currentViewIndex) {                          
            if (currentViewIndex < 1 || (currentViewIndex != 1 && currentViewIndex != this._totalVirtualViews && currentViewIndex == this._currentVirtualIndex && this._checkCurrentVirtualView(this._virtualLoadedRows, currentViewIndex)))
                return false;                      
            this._prevVirtualIndex = this._currentVirtualIndex;							
            this._currentVirtualIndex = currentViewIndex;
			var currentPage = this._calculateCurrentViewPage();
			if(currentPage <= this.model.pageSettings.totalPages && !this._checkCurrentVirtualView(this._virtualLoadedRecords, this._currentVirtualIndex)){				
				if(this._prevVirtualIndex < currentViewIndex && currentViewIndex != 1){
					var setPage = this._isThumbScroll && currentPage != 1 ? currentPage : currentPage + 1;
                    if(!this._virtualPageRecords[setPage] && setPage <= this.model.pageSettings.totalPages)
                        this._setCurrentViewPage(setPage); 
					else	
						this._renderVirtulViewContent(currentPage);	
				}
				else if(this._prevVirtualIndex > currentViewIndex){
					var setPage = this._isThumbScroll ? currentPage : currentPage - 1;
                    if(this._virtualPageRecords[setPage] && !this._virtualLoadedRecords[currentViewIndex - 1])
                        setPage = currentPage - 1;
                    if(!this._virtualPageRecords[setPage] && setPage >= 1)
                        this._setCurrentViewPage(setPage);                                                     
				}                                                
                else 
                    this._renderVirtulViewContent(currentPage);
            }
            else 
                this._renderVirtulViewContent(currentPage);
            return true;            
        },
		_setCurrentViewPage: function(currentPage){
			this._needPaging = true;                
			this._prevPageNo = this._currentPage();             
            this.gotoPage(currentPage);
		},
		_renderVirtulViewContent: function(currentPage){
            this._needPaging = false;                      
            this._refreshVirtualView(this._currentVirtualIndex);
            this.element.ejWaitingPopup("hide");
        },
        _checkCurrentVirtualView: function(virtualContent, viewIndex){
            var virtualRowCount = this._virtualRowCount;            
            var prevView = viewIndex - 1, nextView = viewIndex + 1;
			if(virtualContent instanceof Array){
				if(virtualContent.length){
					if(((prevView == 0 || nextView == this._totalVirtualViews + 1) && $.inArray(viewIndex, virtualContent) != -1) || ($.inArray(prevView, virtualContent) != -1 && 
					$.inArray(viewIndex, virtualContent) != -1 && $.inArray(nextView, virtualContent) != -1))
						return true;					
				}				
			}
			else{
				var nextViewData = nextView == this._totalVirtualViews ? this._lastViewData : virtualRowCount;
				if((!this.initialRender && (viewIndex == 1 && this._virtualLoadedRows[viewIndex]) || viewIndex == this._totalVirtualViews && virtualContent == this._virtualLoadedRows && virtualContent[viewIndex]) ||
					((prevView == 0  && virtualContent[viewIndex] && virtualContent[viewIndex].length == virtualRowCount) || (nextView == this._totalVirtualViews + 1 && virtualContent[viewIndex] && virtualContent[viewIndex].length == this._lastViewData)) ||
					(virtualContent[prevView] && virtualContent[prevView].length == virtualRowCount && virtualContent[viewIndex] && virtualContent[viewIndex].length == virtualRowCount && virtualContent[nextView] && virtualContent[nextView].length == nextViewData))
						return true;								
			}
			return false;
        },
        expandCollapse: function ($target) {
            if ($target.prop("tagName") == "DIV" && ($target.parent().hasClass("e-recordplusexpand") || $target.parent().hasClass("e-recordpluscollapse") || $target.parent().hasClass("e-detailrowcollapse") || $target.parent().hasClass("e-detailrowexpand")))
                $target = $target.parent();
            var index = -1, fieldName, fieldvalue, parentGroup, collapsed;
            if (this.model.allowGrouping && (ej.isOnWebForms || this.initialRender)) {
                fieldName = $target.attr("ej-mappingname");
                fieldValue = $target.attr("ej-mappingvalue");
                if ($target.parents(".e-tabletd").length)
                    parentGroup = $target.parents(".e-tabletd").parent("tr").prev("tr").find(".e-recordplusexpand").attr("ej-mappingvalue");
                collapsed = this.model._groupingCollapsed;
                for (var i = 0; i < collapsed.length; i++) {
                    if (collapsed[i].key == fieldName && collapsed[i].value == fieldValue && (collapsed[i].parent == undefined || collapsed[i].parent == parentGroup)) {
                        index = i;
                        break;
                    }
                }
            }
            if (!($target.hasClass("e-recordplusexpand") || $target.hasClass("e-recordpluscollapse") || $target.hasClass("e-detailrowcollapse") || $target.hasClass("e-detailrowexpand")))
                return;
            if ($target.hasClass("e-recordplusexpand") && this.model.groupSettings.groupedColumns.length) {
                var cellIndex = $target.index();
                var $rows = $target.closest('tr').next();
                $rows.hide();
                $target.removeClass("e-recordplusexpand").addClass("e-recordpluscollapse").find("div").removeClass("e-gdiagonalnext").addClass("e-gnextforward");
                if ((ej.isOnWebForms || this.initialRender) && index == -1)
                    this.model._groupingCollapsed.push({ key: fieldName, value: fieldValue, parent: parentGroup })
            } else if ($target.hasClass("e-recordpluscollapse") && this.model.groupSettings.groupedColumns.length) {
                var cellIndex = $target.index();
                var $rows = $target.closest('tr').next();
                var toExpandRows = [];
                var $row = $rows;
                if ($($row[0].cells[cellIndex]).hasClass("e-indentcell")) {
                    if ($row.children(".e-indentcell").length == ($target.parent().children('.e-indentcell').length) + 1) {
                        $row.show();
                        var $expand = $row.children(".e-recordplusexpand");
                        if ($expand != null && $expand.length > 0) {
                            toExpandRows.push($expand);
                        }
                    }
                }
                $target.removeClass("e-recordpluscollapse").addClass("e-recordplusexpand").find("div").removeClass("e-gnextforward").addClass("e-gdiagonalnext");
                for (var i = 0; i < toExpandRows.length; i++) {
                    toExpandRows[i].removeClass("e-recordplusexpand").addClass("e-recordpluscollapse").find("div").removeClass("e-gdiagonalnext").addClass("e-gnextforward");
                    this.expandCollapse(toExpandRows[i]);
                }
                if ((ej.isOnWebForms || this.initialRender) && index != -1)
                    this.model._groupingCollapsed.splice(index, 1);
            } else if ($target.hasClass("e-detailrowexpand")) {
                var cellIndex = $target.index(), proxy = this;
                var rowIndexValue;
                if (this.model.groupSettings.groupedColumns.length > 0)
                    rowIndexValue = this.getIndexByRow($target.closest('tr')) - $target.closest('tr').parents('tr').prevAll('tr').find('td.e-summaryrow').parent().length;
                else
                    rowIndexValue = this.getIndexByRow($target.closest('tr'));
                var $rows = $target.closest('tr').next();
                $rows.hide(0, function () {
                    var args = { masterRow: $target.closest('tr'), detailsRow: $rows, masterData: proxy._currentJsonData[rowIndexValue] };
                    var foreignKeyData = proxy._getForeignKeyData(args.masterData);
                    if (!ej.isNullOrUndefined(foreignKeyData))
                        args.foreignKeyData = foreignKeyData;
                    proxy._trigger("detailsCollapse", args);
                    proxy.model.childGrid != null && proxy.model.allowScrolling && proxy._refreshScroller({ requestType: "refresh" });
                });
                $target.removeClass("e-detailrowexpand").addClass("e-detailrowcollapse").find("div").addClass("e-gnextforward").removeClass("e-gdiagonalnext");
            } else if ($target.hasClass("e-detailrowcollapse")) {
                var cellIndex = $target.index(), proxy = this;
                var rowIndexValue;
                if (this.model.groupSettings.groupedColumns.length > 0)
                    rowIndexValue = this.getIndexByRow($target.closest('tr')) - $target.closest('tr').parents('tr').prevAll('tr').find('td.e-summaryrow').parent().length;
                else
                    rowIndexValue = this.getIndexByRow($target.closest('tr'));
                var detailrow = $target.closest('tr').next();
                if (detailrow.hasClass("e-detailrow"))
                    $rows = detailrow;
                else {
                    var detailtr = ej.buildTag("tr.e-detailrow", "", { 'display': 'none' }, {});
                    var indenttd = ej.buildTag("td.e-detailindentcell");
                    var hideGroupColumnCount = !this.model.groupSettings.showGroupedColumn ? this.model.groupSettings.groupedColumns.length : 0;
                    var detailstd = ej.buildTag("td.e-detailcell", "", {}, { colspan: this._visibleColumns.length - hideGroupColumnCount });
                    var detaildiv = ej.buildTag("div");
                    var count = $($target.closest('tr')).parents('.e-grid').length;
                    detaildiv.attr("id", "child" + count + "_grid" + rowIndexValue);
                    $(detailtr).append(indenttd);
                    $(detailtr).append(detailstd);
                    var rowData = this._currentJsonData[rowIndexValue];
                    if (this.model.detailsTemplate)
                        $(detailtr).append(detailstd.append(this._renderEjTemplate(this.model.detailsTemplate, rowData)));

                    $($target.closest('tr')).after(detailtr);
                    if (this.model.childGrid) {
                        this.model.childGrid["parentDetails"] = {
                            parentID: this._id,
                            parentPrimaryKeys: this.getPrimaryKeyFieldNames(),
                            parentKeyField: this.model.childGrid.queryString,
                            parentKeyFieldValue: rowData[this.model.childGrid.queryString],
                            parentRowData: rowData
                        }
                        $(detailtr).append(detailstd.append(detaildiv));
                    }
                    $rows = detailtr;
                }
                this._showGridLines();
                var toExpandRows = [];
                var $row = $rows;
                if ($($row[0].cells[cellIndex]).hasClass("e-detailindentcell")) {
                    $row.show(0, function () {
                        var args = { masterRow: $target.closest('tr'), detailsRow: $rows, masterData: proxy._currentJsonData[rowIndexValue] };
                        var foreignKeyData = proxy._getForeignKeyData(args.masterData);
                        if (!ej.isNullOrUndefined(foreignKeyData))
                            args.foreignKeyData = foreignKeyData;
                        proxy._trigger("detailsExpand", args);
                        proxy.model.childGrid != null && proxy.model.allowScrolling && proxy._refreshScroller({ requestType: "refresh" });
                    });					
				    if (!detailrow.hasClass("e-detailrow")) {
                        this._trigger("detailsDataBound", { detailsElement: detailtr, data: rowData }); // $(tbody).append(trchild);
                       this._trigger("refresh");
                    }
                    this.model.childGrid && !ej.isNullOrUndefined(detaildiv) && detaildiv.ejGrid(this.model.childGrid);
                    var $expand = $row.children(".e-detailrowexpand");
                    if ($expand != null && $expand.length > 0) {
                        toExpandRows.push($expand);
                    }
                }
                $target.removeClass("e-detailrowcollapse").addClass("e-detailrowexpand").find("div").addClass("e-gdiagonalnext").removeClass("e-gnextforward");
                for (var i = 0; i < toExpandRows.length; i++) {
                    toExpandRows[i].removeClass("e-detailrowexpand").addClass("e-detailrowcollapse").find("div").removeClass("e-gdiagonalnext").addClass("e-gnextforward");
                    this.expandCollapse(toExpandRows[i]);
                }
            }
            if (this.model.allowScrolling && !ej.isNullOrUndefined(this._scrollObject && this._scrollObject.model) && !$target.closest(".e-hscroll").length)
                this.getScrollObject().refresh();
        },
        _refreshGridPager: function () {
            if (this.getPager() != null) {
                var pagerModel = this.getPager().ejPager("model"), model = {};
                model.currentPage = this._currentPage();
                if (this._filteredRecordsCount == 0 && this.model.currentViewData.length == 0 && (ej.isNullOrUndefined(this._prevPageNo) || this._prevPageNo)) {
                    model.currentPage = 0;
                    this._prevPageNo = pagerModel.currentPage;
                    this.model.pageSettings.currentPage = 0;
                } else if (pagerModel.currentPage == 0 && (ej.isNullOrUndefined(this._prevPageNo) || this._prevPageNo))
                    model.currentPage = this._prevPageNo;
                 var excludeTr = this.model.editSettings.showAddNewRow  && this.model.groupSettings.groupedColumns.length ==  0 ? 1 : 0;
                model.totalRecordsCount = this.model.filterSettings.filteredColumns.length == 0 ? this._searchCount == null ? this._gridRecordsCount - excludeTr : this._searchCount : this._filteredRecordsCount;
                if (ej.util.isNullOrUndefined(model.currentPage))
                    model.currentPage = this._currentPage();
                this.getPager().ejPager("option", model).ejPager("refreshPager");
                this.model.pageSettings.totalPages = pagerModel.totalPages;
				this.model.pageSettings.totalRecordsCount = pagerModel.totalRecordsCount;
            }
        },
        _showHeaderColumn: function (showColumns, field) {
            var $head = this.getHeaderTable().find("thead");
            var $headerCell = $head.find("tr").not(".e-stackedHeaderRow").find(".e-headercell");
            var $filterBarCell = $head.find(".e-filterbar").find(".e-filterbarcell");
            var $col = this.getHeaderTable().find("colgroup").find("col"), column;
            for (var i = 0; i < showColumns.length; i++) {
                if (field)
                    column = ej.isNullOrUndefined(this.getColumnByField(showColumns[i])) ? this.getColumnByHeaderText(showColumns[i], ej.isNullOrUndefined(this.getColumnByField(showColumns[i]))) : this.getColumnByField(showColumns[i]);
                else
                    column = this.getColumnByHeaderText(showColumns[i]);
                var index = $.inArray(column, this.model.columns);
                index = (this.model.detailsTemplate != null || this.model.childGrid) ? index + 1 : index;
                var frznCol = this.model.scrollSettings.frozenColumns;
                if (frznCol != 0 && index >= frznCol)
                    var thIndex = $headerCell.eq(index).removeClass("e-hide").index() + frznCol;
                else
                    var thIndex = $headerCell.eq(index).removeClass("e-hide").index();
                $filterBarCell.eq(thIndex).removeClass("e-hide");
				 if ($col.length > this.model.columns.length && this.model.groupSettings.groupedColumns.length){
					var len = $col.length - this.model.columns.length;
					$col = $col.slice((this.model.detailsTemplate || this.model.childGrid) ? len + 1 : len);				
				}
                $col.eq(index).css("display", "");
            }
            if (this.model.showStackedHeader)
                this._refreshStackedHeader();
        },
        _hideHeaderColumn: function (hiddenColumns, field) {
            var $head = this.getHeaderTable().find("thead");
            var $headerCell = $head.find("tr").not(".e-stackedHeaderRow").find(".e-headercell");
            var $filterBarCell = $head.find(".e-filterbar").find(".e-filterbarcell");
            var $col = this.getHeaderTable().find("colgroup").find("col"), column;
            for (var i = 0; i < hiddenColumns.length; i++) {
                if (field)
                    column = ej.isNullOrUndefined(this.getColumnByField(hiddenColumns[i])) ? this.getColumnByHeaderText(hiddenColumns[i], ej.isNullOrUndefined(this.getColumnByField(hiddenColumns[i]))) : this.getColumnByField(hiddenColumns[i]);
                else
                    column = this.getColumnByHeaderText(hiddenColumns[i]);
                var index = $.inArray(column, this.model.columns);
                var dindex = (this.model.detailsTemplate != null || this.model.childGrid) ? index + 1 : index;
                var frznCol = this.model.scrollSettings.frozenColumns;
                if (frznCol != 0 && index >= frznCol)
                    var thIndex = $headerCell.eq(dindex).addClass("e-hide").index() + frznCol;
                else
                    var thIndex = $headerCell.eq(dindex).addClass("e-hide").index();
                $filterBarCell.eq(thIndex).addClass("e-hide");
                if ($col.length > this.model.columns.length)
                    $col = $col.slice($col.length - this.model.columns.length);
                $col.eq(index).css("display", "none");
            }
            if (this.model.showStackedHeader) {
                this._refreshStackedHeader();
                this._colgroupRefresh();
            }
        },
        _refreshStackedHeader: function () {
			if(this.model.showStackedHeader){
            var stackedRows = this.model.stackedHeaderRows;
            for (var i = 0; i < stackedRows.length; i++) {
                if (this.model.scrollSettings.frozenColumns != 0) {
                    var frznHeader = $(this.getHeaderContent().find(".e-frozenheaderdiv"));
                    var movHeader = $(this.getHeaderContent().find(".e-movableheader"));
                    var newFrzn = this._createStackedRow(stackedRows[i], true);
                    var newMov = this._createStackedRow(stackedRows[i], false);
                    $(frznHeader.find("tr.e-stackedHeaderRow")[i]).replaceWith(newFrzn);
                    $(movHeader.find("tr.e-stackedHeaderRow")[i]).replaceWith(newMov);
                }
                else {
                    var stackedTR = this._createStackedRow(stackedRows[i], false);
                    if (this.getHeaderTable().find("tr.e-stackedHeaderRow")[i])
                        $(this.getHeaderTable().find("tr.e-stackedHeaderRow")[i]).replaceWith(stackedTR);
                    else
                        stackedTR.insertBefore(this.getHeaderTable().find("tr.e-columnheader:last"));
                }
            }
            var args = {};
            args.requestType = "refresh";
            if (this.model.allowGrouping && this.model.groupSettings.groupedColumns.length > 0) {
                for (var i = 0; i < this.model.groupSettings.groupedColumns.length; i++)
                    this.getHeaderTable().find(".e-stackedHeaderRow").prepend(this._getGroupTopLeftCell());
            }
            this.model.allowScrolling && this._refreshScroller(args);
			}

        },
        _getStackedColumnByTarget: function (target) {
            var cls = (target.get(0) || {}).className, match = /e-row([0-9])-column([0-9])/.exec(cls),
                rIndx = match[1], cIndx = match[2], key = [rIndx, "stackedHeaderColumns", cIndx].join(".");

            return ej.getObject(key, this.model.stackedHeaderRows);
        },
        _checkSkipAction: function (args) {
            switch (args.requestType) {
                case ej.Grid.Actions.Save:
                case ej.Grid.Actions.Delete:
                    return true;
            }
            return false;
        },
        _unboundTemplateRendering: function (unboundTemplateId) {
            return $("#" + unboundTemplateId).html();
        },
        _processBindings: function (args) {
            this._requestType = args.requestType;
            this.model.query = this.commonQuery.clone();
            if (!this._checkSkipAction(args) && this._trigger("actionBegin", args))
                return true;
            if (this.model.editSettings.editMode == "batch" && args.requestType != "batchsave" && args.requestType != "cancel" && !this._confirmedValue && this._bulkChangesAcquired() && this.model.editSettings.showConfirmDialog) {
                this._confirmDialog.find(".e-content").html(this.localizedLabels.BatchSaveLostChanges);
                this._confirmDialog.ejDialog("open");
                this._requestArgs = args;
                return false;
            }
            if (!ej.isNullOrUndefined(this.model.dataSource) && args.requestType == "refresh" && this.model.scrollSettings.allowVirtualScrolling) {
                this._currentPage(1);
                this._scrollValue = 0;
                this._loadedJsonData = [];
                this._prevPage = this._currentPage();
            }
            this._ensureDataSource(args);
            if (this.model.scrollSettings.allowVirtualScrolling) {
                if (args.requestType == "virtualscroll") {
                    this._loadedJsonData.push({ pageIndex: this._prevPage, data: this._currentJsonData });
                    this._prevPage = this._currentPage();
                }
                else if(!this.model.scrollSettings.enableVirtualization)
                    this._virtualLoadedRecords[this._currentPage()] = this.model.currentViewData;
                if (args.requestType == "filtering") {
                    this._loadedJsonData = [];
                    this._prevPage = this._currentPage();
                }
            }
            if (this.model.scrollSettings.allowVirtualScrolling && args.requestType == "filtering" && this.model.filterSettings.filteredColumns.length >0) 
                this.getScrollObject().scrollY(0);
            if (this.model.enableRTL) {
                !this.element.hasClass("e-rtl") && this.element.addClass("e-rtl");
            } else {
                this.element.hasClass("e-rtl") && this.element.removeClass("e-rtl")
            }
            if (args.requestType == ej.Grid.Actions.Delete && this.model.groupSettings.groupedColumns.length == 0) {
                if (this.model.editSettings.showAddNewRow)
                    this.getContentTable().find(".e-addedrow").remove();
                args.tr.remove();
            }
            this._editForm = this.model.scrollSettings.frozenColumns > 0 || this.model.editSettings.showAddNewRow ? this.element.find(".gridform") : $("#" + this._id + "EditForm");
			if (!(this.model.editSettings.showAddNewRow && args.requestType == "beginedit") && this._editForm.length != 0) {
                for(var i=0;i<this._editForm.length;i++){
					$(this._editForm[i]).find("select.e-dropdownlist").ejDropDownList("destroy");
					$(this._editForm[i]).find(".e-datepicker").ejDatePicker("destroy");
					$(this._editForm[i]).find(".e-datetimepicker").ejDateTimePicker("destroy");
					$(this._editForm[i]).find(".e-numerictextbox").ejNumericTextbox("destroy");
				}
            }
            if (this._dataSource() instanceof ej.DataManager && !this._isRemoteSaveAdaptor && args.requestType != ej.Grid.Actions.BeginEdit && args.requestType != ej.Grid.Actions.Cancel && args.requestType != ej.Grid.Actions.Add) {
                if (this.model.scrollSettings.allowVirtualScrolling && !this.model.scrollSettings.enableVirtualization && this.model.pageSettings.totalPages == this.model.pageSettings.currentPage) {
                    var pageQuery = ej.pvt.filterQueries(this.model.query.queries, "onPage");
                    this.model.query.queries.splice($.inArray(pageQuery[0], this.model.query.queries), 1);
                    this.model.query.page(this._currentPage() - 1, this.model.pageSettings.pageSize);
                    var lastQueryPromise = this._dataSource().executeQuery(this.model.query);
                    this.model.query.queries.splice($.inArray(pageQuery[0], this.model.query.queries), 1);
                    this.model.query.page(this._currentPage(), this.model.pageSettings.pageSize);
                }
                if (this._virtualSelectedRows && this._virtualSelectedRows.length > 0) {
                    this.model.query.addParams('virtualSelectRecords', this._virtualSelectedRows)
                }
                var queryPromise = this._queryPromise = this._dataSource().executeQuery(this.model.query);
                var waitingPopup = this.element.ejWaitingPopup("instance");
                var proxy = this;
                this.element.ejWaitingPopup("show");
                if (proxy._dataSource().ready) {
                    proxy._dataSource().ready.done(function () {
                        proxy._processDataRequest(proxy, args, queryPromise, lastQueryPromise)
                    });
                }
                else {
                    proxy._processDataRequest(proxy, args, queryPromise, lastQueryPromise)
                }
            } else {
                if (this._isRelationalRendering(args))
                    this._setForeignKeyData(args);
                else
                    this.sendDataRenderingRequest(args);
            }
        },
        _processDataRequest: function (proxy, args, queryPromise, lastQueryPromise) {
            queryPromise.done(ej.proxy(function (e) {
                proxy._relationalColumns.length == 0 && proxy.element.ejWaitingPopup("hide");
                if (lastQueryPromise && !proxy._previousPageRendered) {
                    proxy._processLastPageData(proxy, args, e.result, lastQueryPromise);
                    if (proxy.model.previousViewData && proxy.model.previousViewData.length != 0) {
                        proxy.model.previousViewData.splice(0, e.result.length);
                        proxy._previousPageLength = e.result.length;
                        proxy._currentPageData = e.result;
                        ej.merge(proxy.model.previousViewData, e.result);
                        proxy.model.currentViewData = proxy.model.previousViewData;
                        proxy._remoteLastPageRendered = true;
                    }
                }
                else if (proxy._remoteLastPageRendered && proxy.model.pageSettings.currentPage == proxy.model.pageSettings.totalPages - 1 && !proxy.model.scrollSettings.enableVirtualization) {
                    var count = proxy.model.pageSettings.pageSize - proxy._previousPageLength;
                    for (var dupRow = 0; dupRow < count; dupRow++) {
                        var removeEle = proxy.getRows()[proxy.getRows().length - (proxy.model.pageSettings.pageSize - dupRow)];
                        removeEle.remove();
                    }
                    proxy._tempPageRendered = true;
                    proxy.model.currentViewData = e.result;
                }
                else {
                    if (proxy._identityKeys.length && args.action == "add" && this.adaptor instanceof ej.ODataAdaptor)
                        proxy._processIdentityField(e.result, args);
                    if (proxy.model.pageSettings.currentPage == proxy.model.pageSettings.totalPages - 1 && !proxy._remoteLastPageRendered)
                        proxy._previousPageRendered = true;
                    proxy.model.currentViewData = e.result == null ? [] : e.result;
                    if (proxy._$fkColumn && proxy.model.filterSettings.filterType == "excel" && proxy.model.filterSettings.filteredColumns.length > 0)
                        proxy._fkParentTblData = e.result;
                }
				if(proxy.model.allowScrolling && proxy.model.scrollSettings.allowVirtualScrolling && proxy.model.scrollSettings.enableVirtualization){
					if(args.requestType == "filtering"){
						proxy._gridRecordsCount = proxy._filteredRecordsCount = e.count;
						proxy._refreshVirtualViewDetails();
					}
					if(e.result.length){
						if(proxy._isInitNextPage || proxy._isLastVirtualpage){					
							proxy._setInitialCurrentIndexRecords(e.result, proxy._currentPage());							
							proxy._isInitNextPage = proxy._isLastVirtualpage = false;
						}
						else
							proxy._setVirtualLoadedRecords(e.result, proxy._currentPage());					
						if(proxy._isThumbScroll && !proxy._checkCurrentVirtualView(proxy._virtualLoadedRecords, proxy._currentVirtualIndex))
							proxy._checkPrevNextViews();																										
						proxy._remoteRefresh = true;
					}
					else
						proxy.getContent().find(".e-virtualtop, .e-virtualbottom").remove();					
				}
                if (!ej.isNullOrUndefined(e.aggregates))
                    proxy._remoteSummaryData = e.aggregates;
                proxy._processData(e, args);
				if (!ej.isNullOrUndefined(proxy._unboundRow) && args.selectedRow != proxy._unboundRow && args.requestType == "save") {
                    proxy._unboundRow.find(".e-editbutton").trigger("click");
                    proxy._unboundRow = null;
                }
            }));
            queryPromise.fail(ej.proxy(function (e) {
                proxy.element.ejWaitingPopup("hide");
                args.error = e.error;
                e = [];
                proxy.model.currentViewData = [];
                proxy._processData(e, args);
                proxy._trigger("actionFailure", args);
            }));
        },
        _processIdentityField: function (result, args) {
            var _pKey = this._primaryKeys[0];
            var resultPK = ej.distinct(result, _pKey);
            var curPK = ej.distinct(this.model.currentViewData, _pKey);
            var addPK = $.grep(resultPK, function (value) {
                if ($.inArray(value, curPK) == -1)
                    return true;
                return false;
            });
            args.data = ej.DataManager(result).executeLocal(new ej.Query().where(_pKey, "equal", addPK))[0];
        },
        _processLastPageData: function (proxy, args, currentData, lastQueryPromise) {
            lastQueryPromise.done(ej.proxy(function (e) {
                proxy.model.previousViewData = e.result;
            }));
            lastQueryPromise.fail(ej.proxy(function (e) {
                proxy.element.ejWaitingPopup("hide");
                args.error = e.error;
                e = [];
                proxy.model.previousViewData = [];
                proxy._processData(e, args);
                proxy._trigger("actionFailure", args);
            }));
        },
        _createUnboundElement: function (column) {
            var divElement = document.createElement("div");
            column.headerText = ej.isNullOrUndefined(column.headerText) ? column.field : column.headerText;
            if (!ej.isNullOrUndefined(column.headerText))
            divElement.id = this._id + column.headerText.replace(/[^a-z0-9|s_]/gi, '') + "_UnboundTemplate";
            var $div = ej.buildTag("div.e-unboundcelldiv"), commands = column["commands"];
            for (var unbounType = 0; unbounType < commands.length; unbounType++) {
                var $button = ej.buildTag("button.e-" + commands[unbounType].type.replace(/\s+/g, "") + "button", "", {}, { type: "button" });
                $button.val(commands[unbounType].type);
                $div.append($button);
            }
            $("body").append($(divElement).html($div).hide());
            return divElement;
        },
        _refreshUnboundTemplate: function ($target) {
            if (this._isUnboundColumn) {
                var index = 0;
                for (var column = 0; column < this.model.columns.length; column++) {
                    if (this.model.columns[column]["commands"]) {
                        var $unboundDivs = $target.find(".e-unboundcell.e-" + this.model.columns[column]["headerText"].replace(/[^a-z0-9|s_]/gi, '')+column).find(".e-unboundcelldiv");
                        var commands = $.extend(true, [], this.model.columns[column].commands);
                        for (var j = 0; j < commands.length; j++) {
                            var width = ej.isNullOrUndefined(commands[j].buttonOptions.width) ? "52" : commands[j].buttonOptions.width;
                            var height = ej.isNullOrUndefined(commands[j].buttonOptions.height) ? "30" : commands[j].buttonOptions.height;
                            commands[j].buttonOptions.width = ej.isNullOrUndefined(commands[j].buttonOptions.width) ? "52" : commands[j].buttonOptions.width;
                            commands[j].buttonOptions.height = ej.isNullOrUndefined(commands[j].buttonOptions.height) ? "28" : commands[j].buttonOptions.height;
                            commands[j].buttonOptions.cssClass = ej.isNullOrUndefined(commands[j].buttonOptions.cssClass) ? this.model.cssClass : commands[j].buttonOptions.cssClass;
                            commands[j].buttonOptions.enableRTL = this.model.enableRTL;
                            var $buttons = $unboundDivs.find(".e-" + commands[j].type.replace(/\s+/g, "") + "button");
                            if (!this.model.isEdit || this._requestType == "cancel") {
								if ($target.closest(".e-editcell").length) {
									if (commands[j].type == "save" || commands[j].type == "cancel")
										$buttons.show();
									else {
										$buttons.hasClass("e-deletebutton") && $buttons.hide();
										$buttons.hasClass("e-editbutton") && $buttons.hide();
									}
								} else {
									if (commands[j].type == "save" || commands[j].type == "cancel")
										$buttons.hide();
									else {
										$buttons.hasClass("e-deletebutton") && $buttons.show();
										$buttons.hasClass("e-editbutton") && $buttons.show();
									}
								}
                            }
                            for (var i = 0; i < $buttons.length; i++) {
                                if ($($buttons[i]).data("ejButton"))
                                    $($buttons[i]).ejButton("destroy");
                            }
                            $buttons.ejButton(commands[j].buttonOptions);
                        }
                    } else
                        continue;
                }
            }
        },
        _gridTemplate: function (self, templateId, index) {
            var $column = self.model.columns[index];
            if (self._isGrouping)
                this.index = self._currentJsonData.indexOf(this.data);
            return self._renderEjTemplate("#" + templateId, this.data, this.index, $column);
        },
        _createTemplateElement: function (column, appendTo /* container to append */, text) {
            var tmpl = column["templateID" in column ? "templateID" : "template"], quickReg = /^#([\w-]*)/,
                match = quickReg.exec(tmpl), scriptReg = /^<script/i, appendTo = appendTo || $("body"), scripEle,
                idText = text ? "Pager" : (column.headerText + $.inArray(column, this.model.columns) + "_") + "Template";

            var options = {
                name: "SCRIPT",
                type: "text/x-template",
                text: tmpl,
                id: (this._id + idText).replace(/[^0-9A-z-_]/g, "")
            };

            if ( match && match[1] )
                scripEle = document.getElementById(match[1]);
            else {
                if (scriptReg.test(tmpl)) // branch here to handle tmpl string with SCRIPT. 
                    scripEle = $(tmpl).get(0);
                else
                    scripEle = ej.buildTag(options.name, options.text).get(0);
            }

            scripEle.id = scripEle.id || options.id; // Update Id and type if not in scriptElement template string.
            scripEle.type = scripEle.type || options.type;

            appendTo.append(text ? scripEle.innerHTML : scripEle); //if `text` then append innerHTML instead of element.

            return scripEle;
        },
        _renderGridPager: function () {
            var $div = $(document.createElement('div'));
            var pagerModel = {};
            this.model.pageSettings.click = this._gPagerClickHandler;
            this.model.pageSettings.totalRecordsCount = this._gridRecordsCount;
            this.model.pageSettings.enableRTL = this.model.enableRTL;
            this.model.pageSettings.locale = this.model.locale;
            this.model.pageSettings.enableQueryString = this.model.pageSettings.enableQueryString;
            if (this.model.allowFiltering && this.model.filterSettings.filterType == "filterbar")
                pagerModel.enableExternalMessage = this.model.filterSettings.showFilterBarStatus;
            $.extend(pagerModel, this.model.pageSettings);
            pagerModel.currentPage = this._currentPage();
            pagerModel.masterObject = this;
            this.setGridPager($div);
            $div.ejPager(pagerModel);
            $div.ejPager("refreshPager");
            pagerModel = $div.ejPager("model");
            this.model.pageSettings.totalPages = pagerModel.totalPages;
            if (this._currentPage() !== pagerModel.currentPage)
                this._currentPage(pagerModel.currentPage);
            this._renderPagerTemplate($div);
            return $div;
        },
        _renderPagerTemplate: function (pager, showDefaults) {
            var model = this.model.pageSettings, defaults = pager.find(".e-pagercontainer").not(".e-template").length == 0;            
            pager.find(".e-pagercontainer.e-template").remove();

            if ((showDefaults || !model.enableTemplates) && defaults) //Used to enable default pager from disabled
                pager.ejPager("renderPager");

            if (model.enableTemplates) {                

                if (!model.showDefaults)
                    pager.children().remove();               

                var $customDiv = ej.buildTag('div', null, null, { "class": "e-pagercontainer e-template" });                
                this._createTemplateElement(this.model.pageSettings, $customDiv, true);                
                pager.append($customDiv)
            }          
           
        },
        _renderContext: function (e) {
            var menuitems = this.model.contextMenuSettings.contextMenuItems;
            var item, item2, i = 0;
            var ul = ej.buildTag('ul', "", {}, { id: this._id + '_Context' });
            if (!this.model.contextMenuSettings.disableDefaultItems) {
                for (i; i < menuitems.length; i++) {
                    item = menuitems[i];
                    item2 = this._items(item, "contextMenuItem");
                    ul.append(item2);
                }
            }
            var customitems = this.model.contextMenuSettings.customContextMenuItems;
            var subMenuItems = this.model.contextMenuSettings.subContextMenu;
            var custom, custom2, j = 0;
            for (j; j < customitems.length; j++) {
                custom = customitems[j];
                custom2 = this._items(custom, "customContextMenuItem");                
                for (var k = 0 ; k < subMenuItems.length; k++)
                    if ((typeof custom == "string" && custom ==  subMenuItems[k].contextMenuItem) || (typeof custom == "object" && custom.id ==  subMenuItems[k].contextMenuItem )) {
                        var ul1 = ej.buildTag('ul', "", {}, { id: this._id + '_subMenuContext' + k });
                        for (var l = 0; l < subMenuItems[k].subMenu.length; l++) {
                            menuItem = subMenuItems[k].subMenu[l];
                            menuItem1 = this._items(menuItem, "subMenuItems");
                            ul1.append(menuItem1);
                        }
                        custom2.append(ul1);
                    }
                ul.append(custom2);
            }
            if (ul.find("li").length > 0) {
                this.element.append(ul);
                var parentControl = this.element.parents("div.e-grid");
                var native = ej.Menu.prototype._showContextMenu;
                ej.Menu.prototype._showContextMenu = function (locationX, locationY, target, evt) {
                    $(this.model.contextMenuTarget).hasClass("e-grid") && (++locationX, ++locationY)
                    native.apply(this, [locationX, locationY, target, evt]);
                };
                $(ul).ejMenu({
                    menuType: ej.MenuType.ContextMenu,
                    openOnClick: false,
                    contextMenuTarget: "#" + this._id,
                    click: $.proxy(this._clickevent, this),
                    width: "auto",
                    beforeOpen: $.proxy(this._menu, this)
                });
                if (parentControl.length) {
                    var parentElement = $("#" + parentControl[0].id + '_Context');
                    var target = parentElement.ejMenu("model.excludeTarget");
                    parentElement.ejMenu({ excludeTarget: !ej.isNullOrUndefined(target) && target.length != 0 ? target.concat(",#" + this._id) : "#" + this._id });
                }
                this._conmenu = ul.data("ejMenu");
            }
        },
        _clickevent: function (sender) {
            var args = sender.events.text;
            var tr = $(this._contexttarget.parentNode);
            var c = $(this._contexttarget);
            if (c.hasClass("e-filterset"))
                c = c.siblings();
            else if (c.hasClass("e-icon") || c.hasClass("e-number"))
                c = c.parent();
            var columnName = c.attr("ej-mappingname")|| c.find(".e-headercelldiv").attr("ej-mappingname");
            if (this._trigger("contextClick", sender))
                return;
            switch (args) {
                case this.localizedLabels.AddRecord: this._startAdd();
                    break;
                case this.localizedLabels.EditRecord:
                    if (this.model.editSettings.editMode == "batch") {
                        var colindex = $(this._contexttarget.parentNode).find(".e-rowcell").index(c), index = this._excludeDetailRows().index(tr), fieldName = this.model.columns[colindex]["field"];
                        this.editCell(index, fieldName);
                    }
                    else
                        this.startEdit(tr);
                    break;
                case this.localizedLabels.DeleteRecord:
                    if (this.model.editSettings.showDeleteConfirmDialog)
                        this._confirmDialog.find(".e-content").html(this.localizedLabels.ConfirmDelete).end().ejDialog("open");
                    else
                    this.deleteRow(tr);
                    break;
                case this.localizedLabels.Save: this.endEdit();
                    break;
                case this.localizedLabels.Cancel: this.cancelEdit();
                    break;
                case this.localizedLabels.SortInDescendingOrder: var columnSortDirection = ej.sortOrder.Descending;
                    this.sortColumn(columnName, columnSortDirection);
                    break;
                case this.localizedLabels.SortInAscendingOrder: var columnSortDirection = ej.sortOrder.Ascending;
                    this.sortColumn(columnName, columnSortDirection);
                    break;
                case this.localizedLabels.Grouping: this.groupColumn(columnName);
                    break;
                case this.localizedLabels.Ungrouping: this.ungroupColumn(columnName);
                    break;
                case this.localizedLabels.NextPage:
                case this.localizedLabels.PreviousPage:
                case this.localizedLabels.LastPage:
                case this.localizedLabels.FirstPage: this._page(sender);
                    break;
            }

        },

        _menu: function (sender) {
            var context = this._conmenu.element;
            this._contexttarget = sender.target;
            var targetelement = $(sender.target), element, value;
            var td = $(this._contexttarget);
            if (td.hasClass("e-rowcell") && this.model.allowSelection)
                if (!this.model.isEdit)
                    this.selectRows(this.getIndexByRow(td.parent()), null, td);
            if ((targetelement.hasClass("e-ascending") || targetelement.hasClass("e-descending")) && !targetelement.parent().hasClass("e-headercelldiv"))
                return false;
            if (targetelement.hasClass("e-filtericon") || targetelement.hasClass("e-headercelldiv"))
                element = sender.target.parentNode.getAttribute("aria-sort");
			else if (targetelement.hasClass("e-headercell"))
				element = sender.target.getAttribute("aria-sort");
            else
                element = targetelement.parent().parent().attr("aria-sort");
            var target = sender.target.className;
            var sorting = $(context);
            if (targetelement.hasClass("e-filterset"))
                value = targetelement.siblings().attr("ej-mappingname");
            else if (targetelement.hasClass("e-icon") || targetelement.hasClass("e-number"))
                value = targetelement.parent().attr("ej-mappingname");
            else if(targetelement.hasClass("e-headercell"))
				value=targetelement.find(".e-headercelldiv").attr("ej-mappingname");
			else
                value = targetelement.attr("ej-mappingname");            
            context.css("visibility", "visible");            
            var index = targetelement.closest("tr").hasClass("e-insertedrow") ? this.model.groupSettings.groupedColumns.length : 0;
            var rowCell = targetelement.closest(".e-rowcell");
            var headerCell = targetelement.closest(".e-headercell");
            var tempIndex = rowCell.index() != -1 ? rowCell.index() : headerCell.index() - this.model.groupSettings.groupedColumns.length;
            var columnIndex = targetelement.hasClass("e-rowcell") ? targetelement.index() - index : tempIndex - index;
            columnIndex = (this.model.detailsTemplate != null || this.model.childGrid != null) ? columnIndex - 1 : columnIndex;
            var col = this.model.columns[columnIndex];
            var mapObj = {
                "allowGrouping": ".e-contextgrouping",
                "allowSorting": ".e-contextascending, .e-contextdescending",
                "editSettings.allowAdding": ".e-contextadd",
                "editSettings.allowEditing": ".e-contextedit",
                "editSettings.allowDeleting": ".e-contextdelete",
            };         
            for (var prop in mapObj) {
                var ele = context.find(mapObj[prop]).parent();
                if (ej.getObject(prop, this.model) == false || (ej.getObject(prop, col) === false))
                    ele.css("display", "none");
                else if (ele.css("display") == "none")
                    ele.css("display", "block");
           }
            if (targetelement.closest(".e-grid").attr("id") !== this._id || targetelement.is("input")) {
                context.css("visibility", "hidden");
                return;
            }
            else if (this.getHeaderTable().find(targetelement).length > 0) {
                if (!(headerCell.length != 0 && headerCell.children().hasClass("e-headercelldiv"))) {
                    context.css("visibility", "hidden");
                    return;
                }
                var a = $(context.find(".e-head"));
                context.find(".e-page").css("display", "none");
                context.find(".e-content").css("display", "none");
                context.find(".e-savcan").css("display", "none");
                a.css("display", "block");                
                if(ej.isNullOrUndefined(col.field) || col.field == "") {
                     a.css("display","none");
                     if (context.find(".e-customitem").length == 0)
                        context.css("visibility", "hidden")
               }
             }
            else if (this.getContentTable().find(targetelement).length > 0) {
                if (rowCell.length == 0) {
                    context.css("visibility", "hidden");
                    return;
                }
                var a = $(context.find(".e-content"));
                context.find(".e-head").css("display", "none");
                context.find(".e-page").css("display", "none");
                context.find(".e-savcan").css("display", "none");
                a.css("display", "block");                
                if ((ej.isNullOrUndefined(col.field) || col.field == "") && this.model.editSettings.editMode == "batch") {
                    a.css("display","none");
                    if (context.find(".e-customitem").length == 0)
                       context.css("visibility", "hidden")
               }
            }
            else if (this.getPager().find(targetelement).length > 0 || targetelement.hasClass("e-pager")) {
                var a = $(context.find(".e-page"));
                context.find(".e-head").css("display", "none");
                context.find(".e-content").css("display", "none");
                context.find(".e-savcan").css("display", "none");
                a.css("display", "block");
            }
            else {
                var a = $(context);
                context.css("visibility", "hidden");
                return false;
            }
            switch (element) {
                case "ascending": sorting.find(".ascending").parent().css("display", "none");
                    break;
                case "descending": sorting.find(".descending").parent().css("display", "none");
                    break;
            }
            if (this.model.isEdit && targetelement.hasClass("e-rowcell")) {
                var a = $(context.find(".e-savcan"));
                context.find(".e-head").css("display", "none");
                context.find(".e-content").css("display", "none");
                context.find(".e-page").css("display", "none");
                a.css("display", "block");
            }
            if (this.model.pageSettings.totalPages == 1 && a.hasClass("e-page")) {
                if (context.find(".e-customitem").length == 0)
                    context.css("visibility", "hidden");
                else
                    context.find(".e-page").css("display", "none");
            }            
            else if (this.model.pageSettings.currentPage == 1) {
                sorting.find(".previous").parent().css("display", "none");
                sorting.find(".first").parent().css("display", "none");
            }
            else if (this.model.pageSettings.currentPage == this.model.pageSettings.totalPages) {
                sorting.find(".last").parent().css("display", "none");
                sorting.find(".nextpage").parent().css("display", "none");
            }
            if (this.model.groupSettings.groupedColumns.indexOf(value) != -1)
                a.find(".group").parent().css("display", "none");
            else if (this.model.groupSettings.groupedColumns.indexOf(value) == -1)
                a.find(".ungroup").parent().css("display", "none");
            if (this.model.contextOpen)
                this._trigger("contextOpen", sender);
        },

        _items: function (item, type) {
            if (item == "")
                return false;
            if (type == "contextMenuItem") {
                if (item.indexOf("Record") != -1) {
                    var li = ej.buildTag('li', "", {}, { "class": "e-content" });
                    li.css("display", "none");
                }
                else if (item.indexOf("Page") != -1) {
                    var li = ej.buildTag('li', "", {}, { "class": "e-page" });
                    if (item.indexOf("Next") != -1)
                        var div = ej.buildTag('div', "", {}, { "class": "nextpage" });
                    else if (item.indexOf("Previous") != -1)
                        var div = ej.buildTag('div', "", {}, { "class": "previous" });
                    else if (item.indexOf("Last") != -1)
                        var div = ej.buildTag('div', "", {}, { "class": "last" });
                    else if (item.indexOf("First") != -1)
                        var div = ej.buildTag('div', "", {}, { "class": "first" });
                    li.css("display", "none");
                }
                else if (item == "Save" || item == "Cancel") {
                    var li = ej.buildTag('li', "", {}, { "class": "e-savcan" });
                    li.css("display", "none");
                }
                else if (item.indexOf("Order") != -1 || item == "Grouping" || item == "Ungrouping") {
                    var li = ej.buildTag('li', "", {}, { "class": "e-head" });
                    if (item.indexOf("Ascending") != -1)
                        var div = ej.buildTag('div', "", {}, { "class": "ascending" });
                    else if (item.indexOf("Descending") != -1)
                        var div = ej.buildTag('div', "", {}, { "class": "descending" });
                    else if (item == "Grouping")
                        var div = ej.buildTag('div', "", {}, { "class": "group" });
                    else if (item == "Ungrouping")
                        var div = ej.buildTag('div', "", {}, { "class": "ungroup" });
                    li.css("display", "none");
                }
            }
            if (ej.isNullOrUndefined(li)) {
                var li = ej.buildTag('li', "", {}, { "class": "e-customitem" });
                li.css("display", "block");
            }
            li.append(div);
            var a = document.createElement("a"), classElement = "";
            if (typeof item == "string") {
                if (item.indexOf("Ascending") != -1)
                    classElement = "ascending";
                else if (item.indexOf("Descending") != -1)
                    classElement = "descending";
                else
                    classElement = item.split(" ")[0].toLowerCase();
                a.innerHTML = !ej.isNullOrUndefined(this.localizedLabels[item.replace(/\s+/g, '')]) ? this.localizedLabels[item.replace(/\s+/g, '')] : item;
            }
            if (typeof item == "object") {
                if (item.id == "Ascending")
                    classElement = "ascending";
                else if (item.id == "Descending")
                    classElement = "descending";
                else
                    classElement = item.id.split(" ")[0].toLowerCase();
                a.innerHTML = !ej.isNullOrUndefined(this.localizedLabels[item.text.replace(/\s+/g, '')]) ? this.localizedLabels[item.text.replace(/\s+/g, '')] : item.text;
                li.attr('id', item.id);
            }
			$(a).append(ej.buildTag('span', "", {}, { "class": "e-gridcontext e-icon e-context" + classElement }));
            li.append(a);
            return li;
        },

        _page: function (send) {
            if (send.events.text == this.localizedLabels.NextPage) {
                var b = this.model.pageSettings.currentPage;
                ++b;
                this.gotoPage(b);
            }
            else if (send.events.text == this.localizedLabels.PreviousPage) {
                var b = this.model.pageSettings.currentPage;
                if (b > 1) {
                    --b;
                    this.gotoPage(b);
                }
                else
                    this.gotoPage(b);
            }
            else if (send.events.text == this.localizedLabels.LastPage) {
                var b = this.model.pageSettings.totalPages
                this.gotoPage(b);
            }
            else
                this.gotoPage(1);


        },

        
        gotoPage: function (pageIndex) {
            if (!this.model.allowPaging && (!this.model.allowScrolling && !this.model.scrollSettings.allowVirtualScrolling))
                return;
            var args = {}, returnValue;
            args.previousPage = this._currentPage();
            this._currentPage(pageIndex);
            args.endIndex = ((this._currentPage() * this.model.pageSettings.pageSize) > this._gridRecordsCount) ? (this._gridRecordsCount) : (this._currentPage() * this.model.pageSettings.pageSize);
            args.startIndex = (this._currentPage() * this.model.pageSettings.pageSize) - this.model.pageSettings.pageSize;
            args.currentPage = pageIndex;
            if (this.model.allowPaging) {
                //this.model.pageSettings.currentPage = pageIndex;
                //this. getPager().ejPager("refreshPager");
                args.requestType = ej.Grid.Actions.Paging;
            }
            if (this.model.scrollSettings.allowVirtualScrolling && this.model.allowScrolling) {
                this._isVirtualRecordsLoaded = false;
                var model = this._refreshVirtualPagerInfo();
                this._showPagerInformation(model);
                args.requestType = ej.Grid.Actions.VirtualScroll;
            }
            returnValue = this._processBindings(args);
            if (returnValue)
                this._currentPage(args.previousPage);
            this._primaryKeyValues = [];
        },
        _gPagerClickHandler: function (sender) {
            if (this._prevPageNo == sender.currentPage)
                return;
            this.model.masterObject.gotoPage(sender.currentPage);
            return false;
        },
        _processData: function (e, args) {
            if (e.count == 0 && this.model.currentViewData.length)
                this._gridRecordsCount = e.result.length;
            else
                this._gridRecordsCount = e.count;
            if (this.getPager() != null)
                this.model.pageSettings.totalRecordsCount = this._gridRecordsCount;
            if ((args.requestType == ej.Grid.Actions.Filtering || ej.Grid.Actions.Save || (this.model.filterSettings.filteredColumns.length > 0 && args.requestType == ej.Grid.Actions.Refresh)))
                this._filteredRecordsCount = e.count;
            this._setForeignKeyData(args);
            this._relationalColumns.length == 0 && this.sendDataRenderingRequest(args);
        },

        _frozenCell: function (rowIndex, cellIndex) {
            var currentIndex = cellIndex, frozenDiv = 0, row = this.getRowByIndex(rowIndex), cell;
            if (cellIndex >= this.model.scrollSettings.frozenColumns) {
                frozenDiv = 1;
                currentIndex = currentIndex - this.model.scrollSettings.frozenColumns;
            }
            cell = $(row.eq(frozenDiv).find(".e-rowcell:eq(" + currentIndex + ")"));
            return cell;
        },
        _frozenColumnSelection: function (gridRows, columnIndex, endIndex) {
            var currentIndex = columnIndex, frozenDiv = 0;
            if (endIndex) {
                for (var i = columnIndex; i < endIndex; i++) {
                    currentIndex = i;
                    if (i >= this.model.scrollSettings.frozenColumns) {
                        frozenDiv = 1;
                        currentIndex = i - this.model.scrollSettings.frozenColumns;
                    }
                    for (var j = 0; j < gridRows[frozenDiv].length; j++) {
                        $(gridRows[frozenDiv][j].cells[currentIndex]).addClass("e-columnselection");
                    }
                    $(this.getHeaderTable().find("th.e-headercell")[i]).addClass("e-columnselection");
                    this.selectedColumnIndexes.push(i);
                }
            }
            else {
                if (columnIndex >= this.model.scrollSettings.frozenColumns) {
                    frozenDiv = 1;
                    currentIndex = columnIndex - this.model.scrollSettings.frozenColumns;
                }
                for (var i = 0; i < gridRows[frozenDiv].length; i++) {
                    $(gridRows[frozenDiv][i].cells[currentIndex]).addClass("e-columnselection");
                }
            }

        },
        _renderGridFooter: function () {
            if (this.model.summaryRows.length > 0) {
                var _$gridFooter = ej.buildTag("div.e-gridfooter");
                var $table = ej.buildTag("table.e-gridsummary", "", {}, { cellspacing: "0.25px" });
                this.setGridFooterContent(_$gridFooter);
                if (this.model.scrollSettings.frozenColumns > 0) {
                    var $frozenFooterDiv = ej.buildTag("div.e-frozenfooterdiv"), $movableFooter = ej.buildTag("div.e-movablefooter")
                        , $tableClone = $table.clone(), $movableFooterDiv = ej.buildTag("div.e-movablefooterdiv");
                    $movableFooter.append($movableFooterDiv);
                    $table.append(this.getHeaderTable().first().find('colgroup').clone());
                    $tableClone.append(this.getHeaderTable().last().find('colgroup').clone());
                    $frozenFooterDiv.append($table);
                    $movableFooterDiv.append($tableClone);
                    this.setGridFooterTable($table.add($tableClone));
                    this._createSummaryRows(this.getFooterTable());
                    _$gridFooter.append($frozenFooterDiv.add($movableFooter));
                    _$gridFooter.find(".e-frozenfooterdiv").outerWidth(this.getHeaderContent().find(".e-frozenheaderdiv").width())
                          .end().find(".e-movablefooterdiv").outerWidth(this.getContent().find(".e-movablecontentdiv").width());
                }
                else {
                    $table.append(this.getHeaderTable().find('colgroup').clone());
                    this.setGridFooterTable($table);
                    this._createSummaryRows(this.getFooterTable());
                    _$gridFooter.append($table);
                }
                return _$gridFooter;
            } else
                throw "summary row collection is missing";
        },
        _setSummaryAggregate: function (queryManager) {
            var rows = this.model.summaryRows, scolumns, sCol = [];
            for (var row = 0, rlen = rows.length; row < rlen; row++) {
                scolumns = rows[row].summaryColumns;
                for (var col = 0, clen = scolumns.length; col < clen; col++) {
                    queryManager.aggregate(scolumns[col].summaryType, scolumns[col].dataMember);
                }
            }
        },
        _createSummaryRows: function (table, summaryData, aggregates, item, showGroup) {
            var col = table.find("col");
            if (table.find("tbody").length > 0)
                table.find("tbody").remove();
            var $tBody = ej.buildTag('tbody'), proxy = this, $tBodyClone = $tBody.clone();
            var summaryCol = this.model.summaryRows;
            if (!ej.isNullOrUndefined(summaryData) && this._isCaptionSummary)
                summaryCol = this._captionSummary(showGroup);
            $.each(summaryCol, function (indx, row) {
                if (row.showTotalSummary === false && ej.isNullOrUndefined(summaryData)) return true;
                if (row.showGroupSummary === false && showGroup && !ej.isNullOrUndefined(summaryData)) return true;
                var $tr = ej.buildTag('tr.e-gridSummaryRows');
                if (ej.isNullOrUndefined(item && item.level)) {
                    for (var i = 0; i < proxy.model.groupSettings.groupedColumns.length; i++) {
                        $tr.prepend(ej.buildTag('td').addClass("e-indentcell"));
                    }
                }
                var gc = showGroup ? " e-gcsummary" : "";
                if (proxy.model.detailsTemplate != null || proxy.model.childGrid != null) {
                    if (proxy.model.groupSettings.groupedColumns.length != 0)
                        $tr.children("td.e-indentcell").last().after("<td class='e-summaryrow" + gc + "'></td>");
                    else
                        $tr.prepend("<td class='e-summaryrow'></td>");
                }
                var $cells = proxy.getHeaderTable().find('td').clone().addClass("e-summaryrow" + gc + ""), count = 0;
                var index = 0;
                if (!ej.isNullOrUndefined(row.titleColumn)) {
                    var index = proxy.getColumnIndexByField(row.titleColumn);
                    if (index == -1)
                        index = proxy.getColumnIndexByHeaderText(row.titleColumn);
                }
				if(index != -1)
					$cells = proxy._assignTitleColumn(index, row.title, $cells, count);
                proxy._hideSummaryColumn($cells, col);
                if (proxy.model.scrollSettings.frozenColumns > 0) {
                    var $trClone = $tr.clone();
                    $tBody.append($tr.append($cells.slice(0, proxy.model.scrollSettings.frozenColumns)));
                    $tBodyClone.append($trClone.append($cells.slice(proxy.model.scrollSettings.frozenColumns)));
                }
                else {
                    if ((!proxy._isCaptionSummary || showGroup) && !ej.isNullOrUndefined(item && item.level)) {
                        var level = proxy.model.groupSettings.groupedColumns.length - item.level + 1, tableClone = table.clone().addClass("e-groupsummary"), captionData = {};
                        captionData["data"] = { items: item };
                        $tr.prepend("<td class='e-summaryrow" + gc + "' colspan=" + proxy._colSpanAdjust(null, null, captionData) + " style = 'padding:0;' ></td>");
                        $($tr[0].cells).filter(".e-summaryrow").html(tableClone.append(ej.buildTag("tr", $cells)));
                        var len = tableClone.find("col").length - (proxy.model.columns.length + level);
                        for (var i = 0; i < len; i++) {
                            tableClone.find("col").first().remove();
                        }
                        for (var i = 0; i < level; i++) {
                            $(tableClone[0].rows).prepend("<td class='e-indentcell'></td>");
                            $(tableClone.find("col")[i]).addClass("e-summary");
                        }
                        $tBody.append($tr);
                    }
                    else
                        $tBody.append($tr.append($cells));
                }
                $.each(row.summaryColumns, function (cindx, col) {
                    var value;
                    if (col.summaryType != "custom")
                        value = aggregates ? aggregates[col.dataMember + " - " + col.summaryType] : proxy._remoteSummaryData[col.dataMember + " - " + col.summaryType];
                    else
                        value = proxy.getSummaryValues(col, summaryData);
                    prefix = col.prefix ? col.prefix : "";
                    var index = proxy.getColumnIndexByField(col.displayColumn), suffix = col.suffix ? col.suffix : "";
                    if (proxy.model.allowScrolling)
                        $($cells[index]).addClass("e-scroller");
                    if ($($cells[index]).html() != "" && prefix == "")
                        prefix = $($cells[index]).html();
                    if (!ej.isNullOrUndefined(col.template)) {
                        var obj = {
                            summaryValue: col.format ? proxy.formatting(col.format, value, proxy.model.locale) : value,
							summaryColumn: col
                        };
                        $($cells[index]).html($.render[proxy._id + "_summaryTemplate" + col.template](obj)).css("text-align", proxy.model.columns[index].textAlign)
                        $($cells[index]).addClass("e-summarytemplate")
                    }
                    else if (index != -1)
                        $($cells[index]).html(prefix + (col.format ? proxy.formatting(col.format, value, proxy.model.locale) : value) + suffix).css("text-align", proxy.model.columns[index].textAlign);
                });
            });
            if (this.model.scrollSettings.frozenColumns > 0) {
                table.first().append($tBody);
                table.last().append($tBodyClone);
            }
            else
                table.append($tBody);
        },
        _assignTitleColumn: function (index, title, $cells, count) {
            for (var i = index; i < this.model.columns.length; i++) {
                var colindex = this.model.columns[i];
                if (count == 0 && colindex.visible != false) {
                    $cells.eq(i).html(title);
                    break;
                }
            }
            return $cells;
        },
        getSummaryValues: function (summaryCol, summaryData) {
            var $value, jsonData;
            if (!ej.isNullOrUndefined(summaryData))
                jsonData = summaryData;
            else if (this.model.filterSettings.filteredColumns.length > 0)
                jsonData = this._filteredRecords;
            else
                jsonData = this._dataSource();

            var dbMgr;
            if (jsonData instanceof ej.DataManager) {
                dbMgr = jsonData;
                jsonData = jsonData.dataSource.json;
            } else
                dbMgr = ej.DataManager(jsonData);

            switch (summaryCol.summaryType) {
                case ej.Grid.SummaryType.Maximum:
                    var obj = ej.max(jsonData, summaryCol.dataMember);
                    $value = ej.getObject(summaryCol.dataMember, obj);
                    break;
                case ej.Grid.SummaryType.Minimum:
                    var obj = ej.min(jsonData, summaryCol.dataMember);
                    $value = ej.getObject(summaryCol.dataMember, obj);
                    break;
                case ej.Grid.SummaryType.Average:
                    $value = ej.avg(jsonData, summaryCol.dataMember);
                    break;
                case ej.Grid.SummaryType.Sum:
                    $value = ej.sum(jsonData, summaryCol.dataMember);
                    break;
                case ej.Grid.SummaryType.Count:
                    $value = jsonData.length;
                    break;
                case ej.Grid.SummaryType.TrueCount:
                    var predicate = ej.Predicate(summaryCol.dataMember, "equal", true);
                    $value = dbMgr.executeLocal(ej.Query().where(predicate)).length;
                    break;
                case ej.Grid.SummaryType.FalseCount:
                    var predicate = ej.Predicate(summaryCol.dataMember, "equal", false);
                    $value = dbMgr.executeLocal(ej.Query().where(predicate)).length;
                    break;
                case ej.Grid.SummaryType.Custom:
                    var fn = summaryCol.customSummaryValue;
                    if (fn) {
                        if (typeof fn === "string")
                            fn = ej.util.getObject(fn, window);
                        if ($.isFunction(fn))
                            $value = fn.call(this, summaryCol, jsonData);
                    }
                    break;
            }
            return $value;
        },
        _hideCaptionSummaryColumn: function () {
            var headerColumn = this.getHeaderTable().find('.e-headercelldiv[ej-mappingname]').first();
            var captionTd = this.getContentTable().find('.e-groupcaption').clone();
            var groupCaptionParent = this.getContentTable().find('.e-groupcaption').parent();
            var colLength = this.model.columns.length - 1;
            if (this._isCaptionSummary) {
                this.getContentTable().find('.e-summaryrow:not(.e-gcsummary)').remove();
                this.getFooterTable().find("tbody td").slice(-colLength).removeClass("e-groupcaptionsummary").addClass("e-summaryrow");
                if (this.getFooterTable() != null) {
                    this.getContentTable().find('.e-recordplusexpand').parent().children('.e-indentcell').remove();
                }
                if (!this.model.groupSettings.showGroupedColumn && this.getContentTable().find(".e-groupcaptionsummary").not(".e-hide").length) {
                    var sumColumn = +this.getContentTable().find(".e-recordtable:first").parents("tbody:first").find(".e-groupcaption").attr("colspan");
                    if (this._hiddenColumnsField.length == this.model.columns.length - 1 && headerColumn.parent().hasClass("e-hide") || !sumColumn) {
                        for (i = 0; i < captionTd.length; i++) {
                            groupCaptionParent.eq(i).children().not('.e-hide,.e-recordplusexpand').filter('td.e-groupcaptionsummary:first').addClass("e-hide");
                            var caption = groupCaptionParent.eq(i).find(".e-groupcaption");
                            var colspan = parseInt(caption.attr("colspan"));
                            caption.attr("colspan", ++colspan)
                        }
                    }
                }
            }
            this.getContentTable().find('.e-recordtable').find('.e-indentcell').remove();
        },
        _hideSummaryColumn: function (td, col) {
            if (col.length > this.model.columns.length)
                col = col.slice(col.length - this.model.columns.length);
            if (!this.model.groupSettings.showGroupedColumn && this.model.showSummary) {
                for (i = 0; i < this.model.columns.length; i++) {
                    for (j = 0; j < this.model.groupSettings.groupedColumns.length || j < this._hiddenColumnsField.length; j++) {
                        var headerColumn = this.getHeaderTable().find('.e-headercelldiv:not(.e-emptyCell)');
                        if (!headerColumn.eq(i).is(':visible')) {
                            col.eq(i).css("display", "none");
                            $(td[i]).addClass("e-hide");
                            break;
                        }
                        else {
                            if (col.eq(i).css("display") == "none")
                                col.eq(i).css("display", "");
                        }
                    }
                }
            }
            else {
                for (i = 0; i < this.model.columns.length; i++) {
                    if (!this.model.columns[i]["visible"]) {
                        col.eq(i).css("display", "none");
                        $(td[i]).addClass("e-hide");
                    }
                    else {
                        if (col.eq(i).css("display") == "none")
                            col.eq(i).css("display", "");
                    }
                }
            }
        },

        _initScrolling: function () {
            var frozen = [], unfrozen = [], hideColumns = 0;
            for (var columnCount = 0; columnCount < this.model.columns.length; columnCount++) {
                if (this.model.columns[columnCount].visible === false && columnCount < this.model.scrollSettings.frozenColumns)
                    hideColumns++;
                if (this.model.columns[columnCount]["isFrozen"] === true)
                    frozen.push(this.model.columns[columnCount]);
                else
                    unfrozen.push(this.model.columns[columnCount]);
            }            
            if (frozen.length > 0) {
                var freeze = this.model.scrollSettings.frozenColumns;
                this.model.columns = $.merge($.merge([], frozen), unfrozen);
                this.model.scrollSettings.frozenColumns = frozen.length;
                if (frozen.length != freeze && freeze != 0)
                    this.model.scrollSettings.frozenColumns = freeze;
            }
            if ((this.model.scrollSettings.frozenColumns > 0 || this.model.scrollSettings.frozenRows > 0) && (this.model.allowGrouping || this.model.rowTemplate != null || this.model.detailsTemplate != null || this.model.childGrid != null || this.model.scrollSettings.allowVirtualScrolling || this.model.editSettings.editMode == "batch")) {
                this._renderAlertDialog();
                this._alertDialog.find(".e-content").text(this._getLocalizedLabels()["FrozenNotSupportedException"]);
                this._alertDialog.ejDialog("open");
                return;
            }
            if (this.model.scrollSettings.allowVirtualScrolling && this.model.allowScrolling) {
				if(!this.model.scrollSettings.enableVirtualization){
					this.model.pageSettings.pageSize = this.model.pageSettings.pageSize == 12 ? Math.round(this.model.scrollSettings.height / 32) + 1 : this.model.pageSettings.pageSize;
					this.model.pageSettings.totalPages = Math.ceil(this._gridRecordsCount / this.model.pageSettings.pageSize);
				}
				else{					
					this._vRowHeight = Math.floor(this.getRowHeight() + 1);
					this._virtualRowCount = Math.round(this.model.scrollSettings.height / this._vRowHeight) + 1; 					
					if(this.model.pageSettings.pageSize < this._virtualRowCount * 5)
						this.model.pageSettings.pageSize = this._virtualRowCount * 5;
				}
            }
            if (this.model.width || this.model.height) {
                this.model.allowScrolling = true;
                if (this.model.width) this.model.scrollSettings.width = this.model.width;
                if (this.model.height) this.model.scrollSettings.height = this.model.height;
            }
            this._originalScrollWidth = ej.isNullOrUndefined(this.model.scrollSettings.previousStateWidth) ? this.model.scrollSettings.width : this.model.scrollSettings.previousStateWidth;
        },
        _checkScrollActions: function (requestType) {
            if ((!this.model.scrollSettings.allowVirtualScrolling && (requestType == ej.Grid.Actions.Sorting || requestType == ej.Grid.Actions.Reorder)) || requestType == ej.Grid.Actions.Grouping || requestType == ej.Grid.Actions.Ungrouping || requestType == ej.Grid.Actions.Add || requestType == ej.Grid.Actions.Cancel
                || requestType == ej.Grid.Actions.Save || requestType == ej.Grid.Actions.BatchSave || requestType == ej.Grid.Actions.Delete || requestType == ej.Grid.Actions.Filtering || requestType == ej.Grid.Actions.Paging || requestType == ej.Grid.Actions.Refresh || requestType == ej.Grid.Actions.Search)
                return true;
            return false;
        },
        _frozenAlign: function () {
             var gridContent = this.getContent().first(), browserDetails = this.getBrowserDetails(), direction;
             direction = this.model.enableRTL ? "margin-right" : "margin-left";
             gridContent.find(".e-movablecontent").css(direction, browserDetails.browser === "safari" ? "auto" : gridContent.find(".e-frozencontentdiv").width() + "px");
             this.getHeaderContent().find(".e-movableheader").removeAttr("style").css(direction, browserDetails.browser === "safari" ? "auto" : this.getHeaderContent().find(".e-frozenheaderdiv").width() + "px");
          },
        _refreshScroller: function (args) {
            var gridContent = this.getContent().first(), temp;
            if (ej.isNullOrUndefined(gridContent.data("ejScroller")))
                return;
            if (this.model.scrollSettings.frozenColumns > 0) {
                if (!this._isFrozenColumnVisible()) {
                    gridContent.find(".e-movablecontentdiv").removeAttr("style");
                    this.getHeaderContent().find(".e-movableheaderdiv").removeAttr("style");
                    gridContent.find(".e-frozencontent").width(0);
                    gridContent.find(".e-frozencontentdiv").width(0);
                    gridContent.find(".e-frozencontent").height(0);
                    gridContent.find("e-frozencontentdiv").height(0);
                }
                else if (this._visibleColumns.length <= this.model.scrollSettings.frozenColumns) {
                    var isMovableCol = false;
                    for (var i = this.model.scrollSettings.frozenColumns; i < this.model.columns.length; i++) {
                        if (this._visibleColumns.indexOf(this.model.columns[i].headerText) != -1) {
                            isMovableCol = true;
                            break;
                        }
                    }
                    if (!isMovableCol) {
                        gridContent.find(".e-frozencontentdiv").removeAttr("style");
                        this.getHeaderContent().find(".e-frozenheaderdiv").removeAttr("style");
                        gridContent.find(".e-movablecontent").width(0);
                        gridContent.find(".e-movablecontentdiv").width(0);
                        gridContent.find(".e-movablecontent").height(0);
                        gridContent.find(".e-movablecontentdiv").height(0);
                    }
                }
                else {
                    this._frozenAlign();
                    gridContent.find(".e-movablecontent").scrollLeft(this.getHeaderContent().find(".e-movableheader").scrollLeft());
                    if (!ej.isNullOrUndefined(this.getScrollObject()._vScrollbar) && this.getScrollObject()._vScrollbar.value() > this.getScrollObject()._vScrollbar.model.maximum)
                        temp = this.getScrollObject()._vScrollbar.model.maximum;
                }
                this.refreshScrollerEvent();
            }
            if (this.model.scrollSettings.frozenRows > 0) {
                this._initFrozenRows();
                var temp = this.getScrollObject().model.scrollTop;
                if (!ej.isNullOrUndefined(this.getScrollObject()._vScrollbar) && temp > this.getScrollObject()._vScrollbar.model.maximum)
                    temp = this.getScrollObject()._vScrollbar.model.maximum;
                if ((args.requestType == "cancel" || args.requestType == "save") && temp > this._editFormHeight && this.model.editSettings.editMode.indexOf("inlineform") != -1)
                    temp = temp - this._editFormHeight;
                if (args.requestType == ej.Grid.Actions.Add)
                    this.getScrollObject().scrollY(0, true);
                if (!ej.isNullOrUndefined(this.getScrollObject()._vScrollbar) && !ej.isNullOrUndefined(this.getScrollObject()._vScrollbar._scrollData))
                    this.getScrollObject()._vScrollbar._scrollData.skipChange = true;
            }
            if (args.requestType == "beginedit") {
                var temp = this.getScrollObject().model.scrollTop;
                this.getScrollObject().scrollY(0, true);
            }
            if (!ej.isNullOrUndefined(this.model.dataSource) && (args.requestType == "refresh" || args.requestType=="searching") && this.model.scrollSettings.allowVirtualScrolling) {
                if(this.model.scrollSettings.enableVirtualization && this._isLocalData && this._gridRecordsCount > 0)
					this._refreshVirtualView(this._currentVirtualIndex);
				else
					this._refreshVirtualContent(1);
				if(this._currentVirtualIndex == 1)
					this.getScrollObject().scrollY(0);
            }            
            if (this.model.scrollSettings.frozenColumns > 0)
				this.rowHeightRefresh();
			else
				this.getScrollObject().refresh();
            gridContent.ejScroller("model.enableRTL", this.model.enableRTL);
            if (this.model.isResponsive && (args.requestType == 'searching' || args.requestType == "filtering")) {
                var scrollObj = this.getScrollObject();
                var height = scrollObj.isHScroll() ? this.getContentTable().height() + scrollObj.model.buttonSize : this.getContentTable().height();
                if (height > this.model.scrollSettings.height)
                    height = this.model.scrollSettings.height;
                var scrollWidth= typeof (this.model.scrollSettings.width) == "string" ? this.element.width()-scrollObj.model.buttonSize:this.model.scrollSettings.width;
                width = scrollWidth;
                this.getContent().ejScroller({ height: height, width: width });
            }
            if (this.getScrollObject().isVScroll() && !this.getScrollObject().model.autoHide) {
                this.getHeaderContent().addClass("e-scrollcss");
				this.getHeaderTable().first().width(this.getContentTable().width());
                !this.getHeaderContent().find(".e-headercontent").hasClass("e-hscrollcss") && this.getHeaderContent().find(".e-headercontent").addClass("e-hscrollcss");
            }
            else
                this._showHideScroller();
            this._getRowHeights();
            if (temp && !ej.isNullOrUndefined( this.getScrollObject()._vScrollbar) && args.requestType != ej.Grid.Actions.Add) {
                this._currentTopFrozenRow = 0;
                if (temp > this.getScrollObject()._vScrollbar.model.maximum)
                    temp = this.getScrollObject()._vScrollbar.model.maximum;
                this.getScrollObject()._vScrollbar.scroll(temp);
            }
            if (args.requestType == "virtualscroll") {
                var top = this.getScrollObject().model.scrollTop + this.getScrollObject().model.height - (this.getScrollObject().model.height * .3);
                this.getScrollObject().scrollY(top, true);
            }
        },
        _isFrozenColumnVisible: function () {
            for (var i = 0; i < this.model.scrollSettings.frozenColumns; i++) {
                if (this.model.columns[i].visible)
                    return true;
            }
            return false;
        },
        _frozenPaneRefresh: function () {
            this.getContent().find(".e-frozencontentdiv").css("display", "none");
            this.getHeaderContent().find(".e-frozenheaderdiv").css("display", "none");
            this.getHeaderContent().find(".e-movableheader")[0].style["margin-left"] = "";
            this.getContent().find(".e-movablecontent")[0].style["margin-left"] = "";
            var scrollWidth = ej.isNullOrUndefined(this._scrollObject._vScrollbar) ? 0 : this._scrollObject._vScrollbar["e-vscroll"].width();
            var movableWidth = this.model.scrollSettings.width - scrollWidth - 1;
            if (this.model.scrollSettings.width > this.getContent().find(".e-movablecontentdiv").width()) {
                this.getContent().find(".e-movablecontentdiv").width(movableWidth);
                this.getHeaderContent().find(".e-movableheaderdiv").width(movableWidth);
            }
            this._scrollObject.option("scrollLeft", 0);
        },
        _renderScroller: function () {
            if (!this.model.scrollSettings)
                this.model.scrollSettings = {};
            if (this.model.enablePersistence && (ej.isNullOrUndefined(this.model.scrollSettings.previousStateWidth) || !this.model.scrollSettings.previousStateWidth) && this.model.isResponsive)
                this.model.scrollSettings.previousStateWidth = this.model.scrollSettings.width;
            if (typeof (this._originalScrollWidth) == "string" && !this.model.isResponsive) {
                this.element.css("width", "auto");
                var width = this.element.width();
                if (this.model.scrollSettings.width == "auto" || this._originalScrollWidth == "auto")
                    this._originalScrollWidth = "100%";
                this.model.scrollSettings.width = width * (parseFloat(this._originalScrollWidth) / 100)
            }

            if (typeof (this.model.scrollSettings.height) == "string" && !this.model.isResponsive) {
                var height = this.element.height();
                if (this.model.scrollSettings.height == "auto")
                    this.model.scrollSettings.height = "100%";
                this.model.scrollSettings.height = height * (parseFloat(this.model.scrollSettings.height) / 100)
            }

            if ((this.model.scrollSettings.width || this.model.width) && !this._mediaQuery) {
                var width = this.model.scrollSettings.width || this.model.width;
                if (typeof width == "string")
                    this.element.css("width", this.model.scrollSettings.width || this.model.width);
                else
                    this.element.width(this.model.scrollSettings.width || this.model.width);
            }

            var $content = this.getContent().attr("tabindex", "0"), staticWidth, direction, gridRows = this.getRows();

            if (this.model.scrollSettings.frozenColumns > 0) {
                scrollWidth = this.getContent().find(".e-frozencontentdiv").width() + 20;
                if (scrollWidth > this.model.scrollSettings.width) {
                    this.getContent().remove();
                    this.getHeaderTable().eq(1).remove();
                    this._alertDialog.find(".e-content").text(this.localizedLabels.FrozenColumnsViewAlert);
                    this._alertDialog.ejDialog("open");
                    return;
                }
                staticWidth = this.getContent().find(".e-frozencontentdiv").width();
                direction = this.model.enableRTL ? "margin-right" : "margin-left";
                this.getContent().find(".e-movablecontent").css(direction, staticWidth + "px");
                this.getHeaderContent().find(".e-movableheader").css(direction, staticWidth + "px");
                this.model.scrollSettings["targetPane"] = ".e-movablecontent";
            }
            this._initFrozenRows();
            if (this.model.scrollSettings.autoHide)
                this.model.scrollSettings["show"] = $.proxy(this._showHideScroller, this);
            var proxy = this;
            if (!this.model.scrollSettings.frozenRows)
                this.model.scrollSettings["scroll"] = function (e) {
				if (!ej.isNullOrUndefined(e.scrollData) && e.scrollData.handler == "e-hhandle"){
					if (proxy.model.allowFiltering && (proxy.model.filterSettings.filterType == "menu" || proxy._isExcelFilter)) 				
						!proxy._isExcelFilter ? proxy._closeFilterDlg() : proxy._excelFilter.closeXFDialog();	
					proxy._checkScroller(e, this);
				}
				else{
					proxy._scrollValue = e.scrollTop;
					proxy.model.currentIndex = e.scrollTop == 0 ? e.scrollTop : Math.floor(e.scrollTop / proxy._vRowHeight);	
				}
			};
			if(!this.model.scrollSettings.allowVirtualScrolling && this.model.currentIndex > 0 && !this.model.scrollSettings.scrollTop){
				var sTop = this.model.currentIndex * this.getRowHeight();
				this.model.scrollSettings["scrollTop"] = sTop;
			}
            $content.ejScroller(this.model.scrollSettings);
            if (this.model.rowTemplate != null && (this.getBrowserDetails().browser == "msie" || this.getBrowserDetails().browser == "safari"))
                this.getScrollObject().refresh();            
            if (this.model.scrollSettings.frozenColumns > 0 && this.model.scrollSettings.frozenRows == 0 && this.getScrollObject()._vScrollbar && this.getScrollObject()._hScrollbar)
                this.getScrollObject()._vScrollbar._scrollData.skipChange = this.getScrollObject()._hScrollbar._scrollData.skipChange = true;
            if (!this.model.scrollSettings.autoHide)
                this._showHideScroller();
            if (this.getBrowserDetails().browser == "safari" && this.model.scrollSettings.frozenColumns > 0)
                this.getHeaderContent().find(".e-movableheader").add(this.getContent().find(".e-movablecontent")).css(direction, "auto");
            this.refreshScrollerEvent();
            if (this.model.scrollSettings.frozenColumns > 0 && !this._isFrozenColumnVisible())
                this._frozenPaneRefresh();
            if (proxy.model.scrollSettings.allowVirtualScrolling) {
                var model = this._refreshVirtualPagerInfo();
                this._showPagerInformation(model);
                $content.ejScroller({
                    scroll: function (e) {
						if(proxy.model.scrollSettings.enableVirtualization && e.scrollData != null && e.scrollData.handler != "e-hhandle"){
							e["reachedEnd"] = e.scrollData.scrollable - e.scrollTop == 0;							
							if(e.source == "thumb"){
								var keys = Object.keys(proxy._virtualLoadedRows);
								var index = (proxy._currentVirtualIndex + 2).toString();
								if(proxy.model.scrollSettings.virtualScrollMode == "continuous" && $.inArray(index, keys) == -1 && index < proxy._totalVirtualViews)
									proxy._isContinuous = true;
								else {									
									e.model.scrollTop = e.scrollTop;	
									proxy._isContinuous = false;
									e.cancel = true;									
								}								
							}
							if(e.source == "button" || e.source == "key" || e.source == "wheel"){
								if($("#" + proxy._id + "_WaitingPopup").is(":visible"))	
									e.cancel = true;
								else{
									proxy._isThumbScroll = false;
									proxy._virtualViewScroll(e);
								}
								if(proxy.model.scrollSettings.virtualScrollMode == "continuous" && e["reachedEnd"])
									this.refresh();
							}
							proxy.model.currentIndex = e.scrollTop == 0 ? e.scrollTop : Math.floor(e.scrollTop / proxy._vRowHeight);
						}
						else{
							if (!ej.isNullOrUndefined(e.scrollData) && e.scrollData.handler == "e-hhandle" && proxy.model.allowFiltering && (proxy.model.filterSettings.filterType == "menu" || proxy._isExcelFilter))
								!proxy._isExcelFilter ? proxy._closeFilterDlg() : proxy._excelFilter.closeXFDialog();
							e["reachedEnd"] = this.content()[0].scrollHeight - e.scrollTop == this.content()[0].clientHeight;
							if ((e.source == "button" || e.source == "key" || e.source == "wheel") && proxy.model != null)
								proxy._virtualScroll(e);
							if (e.source == "wheel" && e.scrollTop != proxy._scrollValue)
								e.scrollTop = proxy._scrollValue;
							proxy._checkScroller(e, this);
						}
                    },
                    thumbEnd: function (e) {
						if(proxy.model.scrollSettings.enableVirtualization && proxy.model.scrollSettings.virtualScrollMode == "continuous")
							e["reachedEnd"] = e.scrollData.scrollable - e.model.scrollTop == 0;
                        else if (e.originalEvent && !$(e.originalEvent.target).hasClass("e-rowcell"))
                            e["reachedEnd"] = this.content()[0].scrollHeight - e.scrollData.sTop == this.content()[0].clientHeight;
                        if (e.scrollData.handler == "e-hhandle")
                            return;
                        if (proxy.model != null && e.originalEvent){
                            if(proxy.model.scrollSettings.enableVirtualization){
								proxy._isThumbScroll = true;															
								proxy._virtualViewScroll(e);
								if(proxy.model.scrollSettings.virtualScrollMode == "continuous" && e["reachedEnd"])
									this.refresh();
								if(proxy._isLocalData)																															
									proxy.element.ejWaitingPopup("hide");
							}
							else
								proxy._virtualScroll(e);
						}						
                    },
					scrollEnd: function(e){
						if(e.scrollData.type == "mousewheel" || (e.scrollData.model != null && e.scrollData.model.orientation == "horizontal")) return;			
						if(proxy.model.scrollSettings.enableVirtualization && !proxy._isContinuous){												
							var currentPage = proxy._calculateCurrentViewPage(e.model);
							var isVirtualPage = $.inArray(currentPage, proxy._virtualLoadedPages) != -1;
							if(isVirtualPage){
								proxy._isThumbScroll = true;											
								proxy._virtualViewScroll(e);								
								proxy.element.ejWaitingPopup("hide");	
								if(proxy._totalVirtualViews <= proxy._maxViews * 3)
									this._content[0].scrollTop = e.scrollData.scrollTop;															
							}
							else {                             
								if(!isVirtualPage)
									proxy.element.ejWaitingPopup("show");							
								e.cancel = true;
							}
						}						
					}
                });
            }
        },
		_checkScroller: function(e, scrollObj){
			var scrollLeft = e.scrollLeft > 0 ? e.scrollLeft : Math.abs(e.scrollLeft);
			if(e.source == "thumb" && (scrollObj.content()[0].scrollWidth - scrollLeft == scrollObj.content()[0].clientWidth || scrollLeft == 0)){
				if(this.model.enableRTL){
					var hLeft = scrollLeft == 0 ? e.scrollData.scrollable: 0;
					e.scrollData.sTop = e.model.scrollLeft = hLeft;
					scrollObj.content().scrollLeft(hLeft);	
				}
				scrollObj.refresh();
			}
		},
        _showHideScroller: function () {
            if (this.getScrollObject().isVScroll()) {
                this.getHeaderContent().find("div").first().addClass("e-headercontent");
                !this.model.scrollSettings.autoHide && this.getHeaderContent().addClass("e-scrollcss")
            } else
                this.element.find(".e-gridheader").removeClass("e-scrollcss");
            if (this.getBrowserDetails().browser != "msie" && this.model.scrollSettings.frozenColumns == 0 && !this._mediaQuery) {
                if (!this.element.find(".e-gridheader").hasClass("e-scrollcss") && (this.model.filterSettings.filteredColumns.length || this._hiddenColumns.length)) {
                    this.getHeaderTable().removeAttr('style');
                    this.getContentTable().removeAttr('style');
                }
                else {
                    this.getHeaderContent().find("div table").first().width(this.getContentTable().width());
                    this.getContent().find("div table").first().width(this.getContentTable().width());
                    this.getHeaderTable().width(this.getContentTable().width());
                }
            }
            if (this.getBrowserDetails().browser == "msie" && this.model.scrollSettings.frozenColumns == 0)
                !this.getContent().ejScroller("isVScroll") ? this.getContent().width(this.getHeaderContent().width()) : this.getContent().width(this.getHeaderContent().width() + 18);
            this._isHscrollcss();
        },
        _isHscrollcss: function () {
            var scroller = this.getContent().data("ejScroller"), css = scroller && (scroller.isHScroll() || scroller.isVScroll()) ? "addClass" : "removeClass";
            this.getHeaderContent().find(".e-headercontent")[css]("e-hscrollcss")
        },
        _initFrozenRows: function () {
            var gridRows = this.getRows();
            if (!this.model.currentViewData || this.model.currentViewData.length == 0)
                return;
            if (this.model.scrollSettings.frozenRows > 0 && gridRows != null) {
                this.model.scrollSettings["scroll"] = $.proxy(this._scroll, this);
                this.getContent().find(".e-frozeny").removeClass("e-frozeny")
                    .end().find(".e-frozenrow").removeClass("e-frozenrow");
                if (!ej.isNullOrUndefined(gridRows[0][this.model.scrollSettings.frozenRows - 1]) && !ej.isNullOrUndefined(gridRows[1][this.model.scrollSettings.frozenRows - 1]) && this.model.scrollSettings.frozenColumns > 0)
                    $(gridRows[0][this.model.scrollSettings.frozenRows - 1].cells).add(gridRows[1][this.model.scrollSettings.frozenRows - 1].cells).addClass("e-frozeny").parent().addClass("e-frozenrow");
                else if (!ej.isNullOrUndefined(this.getRowByIndex(this.model.scrollSettings.frozenRows - 1)[0]))
                    $(gridRows[this.model.scrollSettings.frozenRows - 1].cells).addClass("e-frozeny").parent().addClass("e-frozenrow");
                this.model.scrollSettings.height = this._rowHeightCollection[Math.floor(this.model.scrollSettings.height / this._rowHeightCollection[1])] + 18;
            }
            else
                delete this.model.scrollSettings["scroll"];            
        },
        refreshScrollerEvent: function () {
            var proxy = this;
            this.getContent().find(".e-content:first,.e-movablecontent").scroll(ej.proxy(function (e) {
                if (this.model.scrollSettings.targetPane){
                    $movablecontent = $(e.currentTarget).hasClass("e-movablecontent") || !this.model.currentViewData || this.model.currentViewData.length == 0 ? $(e.currentTarget):$(e.currentTarget).find(".e-movablecontent");
                    this.getHeaderContent().find(".e-movableheader").scrollLeft($movablecontent.scrollLeft());
                }
                else
                    this.getHeaderContent().find("div").first().scrollLeft($(e.currentTarget).scrollLeft());                
                if (this.model.scrollSettings.frozenRows > 0 && this.model.editSettings.editMode.indexOf("inlineform") != -1 && this.model.isEdit) {
                    var scrollTop = e.target.scrollTop;
                    this.getContent().find(".e-content").scrollTop(0);
                    this.getScrollObject().scrollY(this.getScrollObject().model.scrollTop + scrollTop, true);
                }
            }, this));
            this.element.find(".e-gridheader").find(".e-headercontent,.e-movableheader").scroll(ej.proxy(function (e) {
                var $currentTarget = $(e.currentTarget);
                if (this.model.scrollSettings.targetPane) {
                    this.getContent().find(".e-movablecontent").scrollLeft($currentTarget.scrollLeft());
                    this.model.showSummary && this.getFooterContent().find(".e-movablefooter").scrollLeft($currentTarget.scrollLeft());;
                }
                else {
                    this.model.showSummary && this.getFooterContent().scrollLeft($currentTarget.scrollLeft());
                    this.getContent().find(".e-content").first().scrollLeft($currentTarget.scrollLeft());
                }
            }, this));
        },
		clearFiltering: function(field){
			if(field)
				this._clearFilter(field);					
			else{
				var fltrCols = this.model.filterSettings.filteredColumns, i=0;				
				while(i < fltrCols.length){
					this._clearFilter(fltrCols[i].field);					
				}
				if(this.model.filterSettings.filterType == "menu" || this.model.filterSettings.filterType == "excel")
					this.getHeaderTable().find(".e-filtericon").removeClass("e-filteredicon e-filternone");
			}
		},
		_clearFilter: function (field) {
		    var filterType = this.model.filterSettings.filterType;
		    if (!ej.isNullOrUndefined(this.getColumnByField(field).filterType))
		        filterType = this.getColumnByField(field).filterType;
		    switch (filterType) {
		        case ej.Grid.FilterType.FilterBar:
		            if ($.inArray(this.getColumnByField(field), this.filterColumnCollection) != -1) {
		                this.getHeaderTable().find("#" + field + "_filterBarcell").val("");
		                this._currentFilterbarValue = "";
		                var index = $.inArray(field, this.filterColumnCollection);
		                this._currentFilterColumn = this.getColumnByField(field);
		                this._showFilterMsg();
		            }
		            break;
		        case ej.Grid.FilterType.Menu:
					var id = "#" + this._id + "_" + this._$colType + "Dlg";
					if (this._$colType == "boolean")
						$(id).find('.e-value .e-js').ejCheckBox("model.checked", false);
					else
						if (this._$colType == "number")
							$(id).find('.e-numerictextbox').ejNumericTextbox("model.value", "");
						else
							$(id).find(".e-value input").val("");					
					if (this._excelFilterRendered || this._isExcelFilter)
					    delete this._excelFilter._predicates[0][field];
					this._$curFieldName = field;						
					break;
				case ej.Grid.FilterType.Excel:
					delete this._excelFilter._predicates[0][field];						
					this._excelFilter.closeXFDialog();
					this._$curFieldName = field;
					break;
			}
			this.filterColumn(field, "", "", "or");							
		},
		clearSearching: function(){
			this.element.find(".e-gridtoolbar #" + this._id + "_search").val("");
			this.search("");
			$.extend(this.model.searchSettings, this.defaults.searchSettings);
		},
        _renderByFrozenDesign: function () {
            var $div = $(document.createElement('div')), col = this._getMetaColGroup().find("col"), colgroups = {};
            colgroups["colgroup1"] = $div.append(ej.buildTag("colgroup").append(col.splice(0, this.model.scrollSettings.frozenColumns))).html();
            colgroups["colgroup2"] = $div.html(ej.buildTag("colgroup").append(col)).html();
            this.getContent().find("div").first().get(0).innerHTML = $.render[this._id + "_FrozenTemplate"]({ datas: this.model.currentViewData }, colgroups);
            this.setGridContentTable(this.getContent().find(".e-table").attr("role", "grid"));
        },
        addFrozenTemplate: function () {
            var template = "<div class='e-frozencontentdiv'>"
            + "<table cellspacing='0.25px' class='e-table'>{{:~colgroup1}}<tbody>"
            + "{{for datas tmpl='" + this._id + "_JSONFrozenTemplate'/}}"
            + "</tbody></table></div>"
            + "<div class='e-movablecontent'><div class='e-movablecontentdiv'><table cellspacing='0.25px' class='e-table'>{{:~colgroup2}}<tbody>"
            + "{{for datas tmpl='" + this._id + "_JSONTemplate'/}}"
            + "</tbody></table></div></div>", templates = {};
            templates[this._id + "_FrozenTemplate"] = template;
            $.templates(templates);
        },
        _getTopRow: function (offsetTop) {
            var currentTopRow = this.model.scrollSettings.frozenRows, i = 0;
            if (offsetTop > 10) {
                for (var i = 0; i < this._rowHeightCollection.length; i++) {
                    if (this._rowHeightCollection[i] > offsetTop) {
                        currentTopRow = this.model.scrollSettings.frozenRows + i - 1;
                        break;
                    }
                }
            }
            return { imaginaryIndex: currentTopRow, actualIndex: i };
        },
        _showHideRow: function (from, to, action, scrollPosition) {
            var rows = this.getRows();
            if (this.model.scrollSettings.frozenColumns > 0)
                $(rows[0]).slice(from, to).add($(rows[1]).slice(from, to).toArray())[action]();
            else
                $(rows).slice(from, to)[action]();
            this._currentTopFrozenRow = action == "show" ? from : to;
            this.getScrollObject()._changevHandlerPosition(scrollPosition);
        },
        _scroll: function (args) {
            if (args.scrollData != null && args.scrollData.dimension != "width") {
                args.cancel = true;
                var rows = this.getRows(), indexes = this._getTopRow(args.scrollTop), currentTopRow = indexes.imaginaryIndex, frozenRows;
                if (currentTopRow > this._currentTopFrozenRow)
                    this._showHideRow(this.model.scrollSettings.frozenRows, currentTopRow, "hide", args.scrollTop);
                else if (currentTopRow < this._currentTopFrozenRow)
                    this._showHideRow(currentTopRow, this._currentTopFrozenRow + 1, "show", args.scrollTop);
                var movableContent = this.getContentTable().last().find("tr");
                var border = (parseInt(movableContent.last().find("td:first").css("border-top-width")) * 2) + 1;
                if (args.scrollTop == this.getScrollObject()._vScrollbar.model.maximum && ((movableContent.last()[0].offsetTop + movableContent.last().height() - border) > this.element.find(".e-content").height())) {
                    var totalHeight = movableContent.last().prev()[0].offsetTop + movableContent.last().prev().height();
                    var count = 1;
                    for (var i = (movableContent.length - 2) ; totalHeight - border > this.element.find(".e-content").height() ; i++) {
                        totalHeight = movableContent[i].offsetTop + movableContent.eq(i).height();
                        count++;
                        break;
                    }
                    this._showHideRow(this.model.scrollSettings.frozenRows, currentTopRow + count, "hide", args.scrollTop);
                }
                args.model.scrollTop = args.scrollTop;
            }
            else {
                if (!ej.isNullOrUndefined(this.getScrollObject()._vScrollbar) && !ej.isNullOrUndefined(this.getScrollObject()._vScrollbar._scrollData))
                    this.getScrollObject()._vScrollbar._scrollData.skipChange = true;
            }
        },
        _renderAlertDialog: function () {
            var $contentDiv = ej.buildTag('div.e-content', this._getLocalizedLabels()["frozenColumnsMessage"])
                , $buttons = ej.buildTag('span.e-buttons', "<input type='button' id=" + this._id + 'ConfirmDialogOK' + " value='" + this._getLocalizedLabels()["OkButton"] + "'/>");
            this._alertDialog = ej.buildTag('div#' + this._id + 'AlertDialog');
            this._alertDialog.append($contentDiv).append($buttons);
            this.element.append(this._alertDialog);
            $buttons.find("input").ejButton({
                cssClass: this.model.cssClass,
                showRoundedCorner: true,
                size: "mini",
                click: $.proxy(function (args) {
                    this._alertDialog.ejDialog("close");
                }, this)
            });
            this._renderFDialog(this._id + 'AlertDialog');
            this._alertDialog.ejDialog({ width: "auto", enableModal: true });
        },
        _renderFDialog: function (id) {
            $("#" + id).ejDialog({ showOnInit: false, "enableRTL": this.model.enableRTL, "cssClass": this.model.cssClass, "showHeader": false, width: 260, enableResize: false, allowKeyboardNavigation: false, content: "#" + this._id });
        },
        _virtualScroll: function (e) {
            if (e != null) {
                var flag = 0;
                var recordCount = this.model.filterSettings.filteredColumns.length == 0 ? this._searchCount == null ? this._gridRecordsCount : this._searchCount : this._filteredRecordsCount;
                var pageInfo = this.model.pageSettings;
                var tbody = this.getContentTable()[0].tBodies[0];
                var virtualRows = $(tbody).find('tr.e-virtualrow');
                pageInfo.totalPages = Math.ceil(recordCount / pageInfo.pageSize);
                if (e.scrollTop !== undefined)
                    e.model.scrollTop = e.scrollTop;
                if (e.reachedEnd != undefined) e.model.reachedEnd = e.reachedEnd;
                var currentPageNo = this._calculateCurrenPage(virtualRows, this.getContentTable(), e.model);
                if (currentPageNo > pageInfo.totalPages)
                    currentPageNo = pageInfo.totalPages;
                if (pageInfo.currentPage != currentPageNo && $.inArray((currentPageNo - 1) * pageInfo.pageSize, this.virtualLoadedPages) == -1) {
                    this._isVirtualRecordsLoaded = false;
                }
                if (!this._isVirtualRecordsLoaded) {
                    if ($.inArray((currentPageNo - 1) * pageInfo.pageSize, this.virtualLoadedPages) == -1) {
                        if (this.model.scrollSettings.virtualScrollMode == "continuous" && !e.reachedEnd)
                            return
                        if (currentPageNo == pageInfo.totalPages && $.inArray((currentPageNo - 2) * pageInfo.pageSize, this.virtualLoadedPages) == -1) {
                            flag++;
                            this.set_currentPageIndex(currentPageNo);
                        }
                        if (flag == 1) this._lastRow = true;
                        this.set_currentPageIndex(currentPageNo);
                    }
                    pageInfo.currentPage = currentPageNo;
                }
                else
                    pageInfo.currentPage = currentPageNo;
                var model = this._refreshVirtualPagerInfo();
                this._showPagerInformation(model);
            }
        },
		_virtualViewScroll: function (e) {
            if (e != null) {                
                if (e.scrollTop !== undefined)
                    e.model.scrollTop = e.scrollTop;
                if (e.reachedEnd != undefined) e.model.reachedEnd = e.reachedEnd;
                var currentVirtualIndex = this._calculateCurrentVirtualIndex(e);									
                if ($.inArray(currentVirtualIndex, this._currentLoadedIndexes) == -1)
                    this._isVirtualRecordsLoaded = false;                               
                if (!this._isVirtualRecordsLoaded)                     
                    this.set_currentVirtualIndex(currentVirtualIndex);                							
            }
		},
        _createPagerStatusBar: function () {
            var $statusBar = this.element.find(".e-pagerstatusbar");
            if ($statusBar.length)
                $statusBar.remove();
            var $pagermsgDiv = ej.buildTag('div.e-pagermsgdiv');
            this.$pagerStatusBarDiv = ej.buildTag('div.e-pagerstatusbar').append($pagermsgDiv);
            if (this.model.scrollSettings.allowVirtualScrolling && this.model.allowFiltering && this.model.filterSettings.filterType == "filterbar") {
                var $messageDiv = ej.buildTag('div.e-pagerfiltermsg').css("display", "none");;
                this.$pagerStatusBarDiv.append($messageDiv);
            }
            this.$pagerStatusBarDiv.appendTo(this.element);
            this.$pagerStatusBarDiv.css("display", "none");
        },
        _refreshVirtualContent: function (currentPage) {
            var rowHeight = this.getRowHeight();
            var recordsCount = this.model.filterSettings.filteredColumns.length == 0 ? this._searchCount == null ? this._gridRecordsCount : this._searchCount : this._filteredRecordsCount;
            if (currentPage != null) {
                this._currentPage(currentPage);
                var model = this._refreshVirtualPagerInfo();
                this._showPagerInformation(model);
            }
            var currentIndex = this.getCurrentIndex();
            var tbody = this.getContentTable()[0].tBodies[0];
            if (currentIndex > 0) {
                var virtualTRTop = document.createElement("tr");
                $(virtualTRTop).addClass("e-virtualrow").css("height", rowHeight * currentIndex).prependTo(tbody);
            } if (currentIndex + this.model.pageSettings.pageSize <= recordsCount && this.getContentTable().find("tr").last().hasClass("e-virtualrow") != true && this.model.scrollSettings.frozenColumns == 0) {
                var virtualTRBottom = document.createElement("tr");
                var virtualHeight = this.model.scrollSettings.virtualScrollMode == "normal" ? rowHeight * (recordsCount - (currentIndex + this.model.pageSettings.pageSize)) : 1;
                $(virtualTRBottom).addClass("e-virtualrow").css("height", virtualHeight).appendTo($(tbody));
            }
            this.virtualLoadedPages = new Array();
            this.orderedVirtualLoadedPage = [];
            this.virtualLoadedPages.push(currentIndex >= 0 ? currentIndex : 0);
            this.orderedVirtualLoadedPage.push(currentIndex >= 0 ? currentIndex : 0);
            var focusTR = $(tbody).find('tr:not(.e-virtualrow)').attr('name', currentIndex >= 0 ? currentIndex : 0)[0];
            if (focusTR && focusTR.previousSibling && ($(focusTR.previousSibling).hasClass("e-virtualrow") || focusTR.previousSibling.offsetTop > (currentIndex * this.getContent().height()))) {
                this.getContent().children("div").first().scrollTop(this.getContent().find(".content").scrollTop() - (this.getContent().find(".content").scrollTop() - focusTR.offsetTop));
                this._isVirtualRecordsLoaded = true;
            }
        },
		_refreshVirtualView: function (currentIndex) {
			if(!this._singleView){			
				var virtualRowCount = this._virtualRowCount;				
				if(currentIndex){     
					var scrollRefresh, currentPage;
					if(currentIndex > this._totalVirtualViews){						
						currentIndex = 1;					
						scrollRefresh = true;						
					}						
					this._currentVirtualIndex = currentIndex;
					if(!this._virtualLoadedRecords[currentIndex]){
						if(!this._virtualDataRefresh && this._currentVirtualIndex != this._totalVirtualViews) scrollRefresh = true;
						currentPage = Math.ceil(currentIndex * this._virtualRowCount / this.model.pageSettings.pageSize);
					}
					else				
						currentPage = Math.ceil(this.model.currentIndex / this.model.pageSettings.pageSize);
					this._refreshVirtualViewScroller(scrollRefresh);
					if(currentPage > this.model.pageSettings.totalPages) currentPage = this.model.pageSettings.totalPages;
					if(currentPage <= 0) currentPage = 1;
					if($.inArray(currentPage, this._virtualLoadedPages) == -1)
						this.gotoPage(currentPage);
					else{
						this._currentPage(currentPage);
						if(!this._checkCurrentVirtualView(this._virtualLoadedRecords, currentIndex))
							this._needPaging = true;
						else
							this._needPaging = false;
						this._getVirtualLoadedRecords(this.model.query);
						this._replacingVirtualContent();				
					}
				}
				else{               					
					this._refreshVirtualViewDetails();					
					var rows = $(this.getContentTable()[0].rows);
					this._setVirtualTopBottom();
					if (this.initialRender){
						for (var i = 0; i < this._currentLoadedIndexes.length; i++) {
							var currentLoadedIndex = this._currentLoadedIndexes[i]; viewIndex = (i + 1) * virtualRowCount, viewCount = i * virtualRowCount;
							$(rows[viewIndex - 1]).addClass("e-virtualview" + currentLoadedIndex);
							var hex = currentLoadedIndex.toString(32);
							var vRows = rows.slice(viewCount, viewCount + virtualRowCount).attr('name', hex).detach();
							this._virtualLoadedRows[currentLoadedIndex] = vRows;
							vRows.appendTo(this.getContentTable());
						}
						if(this._currentVirtualIndex > 1) 
							this._refreshVirtualViewScroller();											
					}			
					this._eventBindings();
				}
				if($.inArray(this._currentPage(), this._virtualLoadedPages) == -1)
					this._virtualLoadedPages.push(this._currentPage());				
			}
			else {
				this._singleView = false;				
				this._addLastRow();	
				this.getContent().find(".e-virtualtop, .e-virtualbottom").remove();
				var hex = this._currentVirtualIndex.toString(32);				
				$(this._gridRows).attr('name', hex);
				this._virtualLoadedRows[this._currentVirtualIndex] = this._gridRows;				
				this._eventBindings();
			}
			if(!currentIndex && (this.model.queryCellInfo || this.model.rowDataBound)){
				for(var i = 0; i < this._currentLoadedIndexes.length; i++){					
					if($.inArray(this._currentLoadedIndexes[i], this._queryCellView) == -1)
						this._queryCellView.push(this._currentLoadedIndexes[i]);						
				}
			}
			this._isThumbScroll = false;
			this._virtualDataRefresh = false;
        },
		_refreshVirtualViewData: function(){
			this._virtualLoadedRecords = {};
			this._virtualLoadedRows = {};	
			this._virtualLoadedPages = [];	
			this._virtualPageRecords = {};
			this._queryCellView	= [];									
			if(this.model.pageSettings.totalPages != null && this._currentPage() > this.model.pageSettings.totalPages){
				this._currentPage(1);
				this._currentVirtualIndex = 1;
			}			
		},
		setCurrentPageData: function(currentData){
			if(this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){
				this._refreshVirtualViewData();
				this._refreshVirtualViewDetails();										
				this._setVirtualLoadedRecords(currentData, this._currentPage());
				this._refreshVirtualView(this._currentVirtualIndex);
			}
		},
		_refreshVirtualViewScroller: function(needRefresh){
			var scrollValue;
			if((this.initialRender && !this.model.scrollSettings.scrollTop) || needRefresh){
				var rowHeight = this._vRowHeight;				   
				scrollValue = this.model.currentIndex * this._vRowHeight;
			}
			else
				scrollValue = this._scrollObject.model.scrollTop;
			this.getContent().ejScroller("model.scrollTop", scrollValue);           
            this._scrollValue = scrollValue;
        },
		_calculateCurrentViewPage: function (args) {
			if(!args) args = this._scrollObject.model;
            var pageSize = this.model.pageSettings.pageSize;                                
            var currentPage =  Math.ceil((args.scrollTop + this.model.scrollSettings.height) / this._vRowHeight / pageSize);
			// if(this.model.scrollSettings.virtualScrollMode == "continuous")
				// currentPage = Math.ceil(this._currentVirtualIndex * this._virtualRowCount / this.model.pageSettings.pageSize);
            if(this.model.pageSettings.totalPages == null)
                this.model.pageSettings.totalPages = Math.ceil(this._getVirtualTotalRecord() / pageSize);                         
            if(currentPage > this.model.pageSettings.totalPages)
                currentPage = this.model.pageSettings.totalPages;                                             
            return currentPage;
        },
		_calculateCurrentVirtualIndex: function (e) {
            var args = e.model, recordCount = this._getVirtualTotalRecord();
            var currentIndex, trEle, isLast, viewTr = [], cur, oTop, len, sTop = args.scrollTop;
            var index = sTop + this.model.scrollSettings.height;
            currentIndex = index / this._vRowHeight / this._virtualRowCount;                    
            if (this._prevVirtualIndex > this._currentVirtualIndex && sTop <= this._scrollValue)
                currentIndex = Math.floor(currentIndex);
            else
                currentIndex = Math.ceil(currentIndex);
            if (sTop >= this._scrollValue && args.virtualScrollMode == "continuous" && args.reachedEnd) 
                currentIndex = currentIndex + 1;                      
            if(currentIndex > this._totalVirtualViews) currentIndex = this._totalVirtualViews;
            if(currentIndex <= 0) currentIndex = 1;                
            if ($.inArray(currentIndex, this._currentLoadedIndexes) !== -1 && this._virtualLoadedRows[currentIndex] && sTop != e.scrollData.scrollable) {
                var viewTrs = this.getContentTable()[0].rows; len = viewTrs.length;
                var virtualTopHeight = this.getContent().find(".e-virtualtop").height();
                isLast = sTop >= this._scrollValue;
                for (var i = 0; i < len; i++) {
                    cur = viewTrs[i];
                    oTop = cur.offsetHeight + cur.offsetTop + virtualTopHeight;
                    if (oTop > sTop + this.model.scrollSettings.height) {
                        if (viewTr.length === 0 && i !== 0)
                            viewTr = [viewTrs[cur.offsetTop <= sTop + this.model.scrollSettings.height ? i : i - 1]];
                        break;
                    }
                    if (oTop >= sTop && oTop <= sTop + this.model.scrollSettings.height) {
                        viewTr.push(cur);
                        if (isLast === false && viewTr.length > 1)
                            break;
                    }
                }
                trEle = $(sTop >= this._scrollValue ? viewTr[viewTr.length - 1] : viewTr[0]);
                if(trEle.length)
                    currentIndex = parseInt(trEle.attr("name"), 32);
            }						
            this._scrollValue = sTop;           
            return currentIndex;
        },
        _calculateCurrenPage: function (virtualRows, target, args) {
            var pageSize = this.model.pageSettings.pageSize;
            var currentPage, tempCPage, diff, proxy = this, trEle, isLast, viewTr = [], cur, oTop, len,currentRowValue,$currentRow;
            var rowHeight = this.getRowHeight();
            currentPage = (args.scrollTop + this.model.scrollSettings.height) / rowHeight / pageSize;            
            currentRowValue = (this.model.pageSettings.pageSize * (this.model.pageSettings.currentPage -1 ));
			 $currentRow = this.getContentTable().find("tr[name="+currentRowValue+"]").eq(0);
			if ($currentRow.length && $currentRow.offset().top > 0 && currentPage >= 1 &&  args.scrollTop < this._scrollValue && this.virtualLoadedPages.indexOf(Math.ceil(currentPage - 1) * pageSize) !== -1)
                currentPage = Math.floor(currentPage);
            else
                currentPage = Math.ceil(currentPage);

            if (args.scrollTop >= this._scrollValue && args.virtualScrollMode == "continuous" && args.reachedEnd) {
                currentPage = this.virtualLoadedPages[this.virtualLoadedPages.length - 1] / pageSize + 2;
            }

            if ($.inArray((currentPage - 1) * pageSize, this.virtualLoadedPages) !== -1) {
                var viewTrs = this.getContentTable().children("tbody").children("tr"); len = viewTrs.length;
                isLast = args.scrollTop >= this._scrollValue;
                for (var i = 0; i < len; i++) {
                    cur = viewTrs[i];
                    oTop = cur.offsetHeight + cur.offsetTop;
                    if (oTop > args.scrollTop + proxy.model.scrollSettings.height) {
                        if (viewTr.length === 0 && i !== 0)
                            viewTr = [viewTrs[cur.offsetTop <= args.scrollTop + proxy.model.scrollSettings.height ? i : i - 1]];
                        break;
                    }
                    if (oTop >= args.scrollTop && oTop <= args.scrollTop + proxy.model.scrollSettings.height) {
                        viewTr.push(cur);
                        if (isLast === false && viewTr.length > 1)
                            break;
                    }
                }
                trEle = $(args.scrollTop >= this._scrollValue ? viewTr[viewTr.length - 1] : viewTr[0]);
                if (trEle.hasClass('e-virtualrow')) {
                    if (viewTr.length === 1) {
                        currentPage++;
                    }
                }
                else
                    currentPage = parseInt(trEle.attr("name"), 10) / pageSize + 1;
            }
            this._scrollValue = args.scrollTop;
            for (var index = 0; index < virtualRows.length; index++) {
                var val = virtualRows[index];
                if (val.offsetTop + val.offsetHeight >= args.scrollTop) {
                    var prevVirtualPage = this._calculatePrevPage(virtualRows, target, args);
                    this._prevPageNo = prevVirtualPage;
                    if (currentPage == 0)
                        currentPage = 1;
                    currentPage = currentPage > this.model.pageSettings.totalPages ? this.model.pageSettings.totalPages : currentPage;
                    return currentPage;
                }
            }
            return currentPage;
        },
        _calculatePrevPage: function (virtualRows, target, args) {
            for (var i = 0; i < virtualRows.length; i++) {
                var val = virtualRows[i];
                if (val.offsetTop + val.offsetHeight >= args.scrollTop) {
                    var trElement = $(val).prevAll('tr[name]')[0];
                    if (trElement != null) {
                        return Math.ceil(parseInt($(trElement).attr('name'), 10) / this.model.pageSettings.pageSize) + 1;
                    }
                }
            }
            return -1;
        },
        _refreshVirtualPagerInfo: function () {
            var model = {};
            model.pageSize = this.model.pageSettings.pageSize;
            model.currentPage = this._currentPage();
            model.totalRecordsCount = this.model.filterSettings.filteredColumns.length == 0 ? this._searchCount == null ? this._gridRecordsCount : this._searchCount : this._filteredRecordsCount;
            model.totalPages = Math.ceil(model.totalRecordsCount / model.pageSize);

            return model;
        },
        _showPagerInformation: function (model) {
            var from = (model.currentPage - 1) * model.pageSize;
            $(this.$pagerStatusBarDiv).find("div:first").html(String.format(this.localizedLabels.PagerInfo, model.currentPage, model.totalPages, model.totalRecordsCount), from, from + model.pageSize);
            $(this.$pagerStatusBarDiv).css('display', 'block');
        },
        _cellMerging: function (args) {
            args.colMerge = function (range) {
                if (this.cell.className.indexOf("e-colmerge") == -1) {
                    this.cell.className += " e-colmerge";
                    if (this.model.columns.length - this.cell.cellIndex < range)
                        range = this.model.columns.length - this.cell.cellIndex;
                    this.cell.colSpan = range;
                    for (var i = 1; i < range; i++) {
                        if (!ej.isNullOrUndefined(this.cell.parentElement.children[this.cell.cellIndex + i]))
                            this.cell.parentElement.children[this.cell.cellIndex + i].className += " e-hide";
                    }
                }
            };
            args.rowMerge = function (range) {
                if (this.cell.className.indexOf("e-rowmerge") == -1) {
                    this.cell.className += " e-rowmerge";
                    var ele = this.cell.parentNode.parentNode;
                    if (ele.rows.length - this.cell.parentElement.rowIndex < range)
                        range = ele.rows.length - this.cell.parentElement.rowIndex;
                    this.cell.rowSpan = range;
                    for (var i = 0; i < range - 1; i++) {
                        if (!ej.isNullOrUndefined(ele.children[this.cell.parentElement.rowIndex + i].nextSibling)) {
                            if (!($(".e-grid").children().is('.e-dialog')) || ($(".e-grid").find('.e-dialog').attr("style").indexOf("display: none")) != -1 || this.model.allowFiltering)
                                ele.children[this.cell.parentElement.rowIndex + i].nextSibling.children[this.cell.cellIndex].className += " e-merged e-hide";
                        }
                        else
                            break;
                    }
                }
            };
            args.merge = function (col, row) {
                if (col > 1 && row > 1) {
                    if (this.cell.className.indexOf("e-colmerge") == -1) {
                        this.cell.className += " e-colmerge";
                        var ele = this.cell.parentNode.parentNode;
                        if (ele.rows.length - this.cell.parentElement.rowIndex < row)
                            row = ele.rows.length - this.cell.parentElement.rowIndex;
                        if (!($(".e-grid").children().is('.e-dialog')) || ($(".e-grid").find('.e-dialog').attr("style").indexOf("display: none")) != -1 || this.model.allowFiltering) {
                            for (var i = 0; i < row ; i++) {
                                if (!ej.isNullOrUndefined(ele.children[this.cell.parentElement.rowIndex + i])) {
                                    var selectCell = ele.children[this.cell.parentElement.rowIndex + i].children[this.cell.cellIndex];
                                    if (this.model.columns.length - selectCell.cellIndex < col)
                                        col = this.model.columns.length - selectCell.cellIndex;
                                    selectCell.colSpan = col;
                                    for (var j = 1; j < col; j++) {
                                        if (!ej.isNullOrUndefined(selectCell.parentElement.children[this.cell.cellIndex + j]))
                                            selectCell.parentElement.children[this.cell.cellIndex + j].className += " e-hide";
                                    }
                                }
                                else
                                    break;
                            }
                        }
                        else {
                            this.cell.colSpan = col;
                            for (var j = 1; j < col; j++) {
                                if (!ej.isNullOrUndefined(this.cell.nextSibling))
                                    this.cell.parentElement.children[this.cell.cellIndex + j].className += " e-hide";
                            }
                        }
                        args.rowMerge(row);
                    }
                }
                else {
                    if (col > 1)
                        args.colMerge(col);
                    if (row > 1)
                        args.rowMerge(row);
                }
            };
        },
        _replacingContent: function () {
            var temp = document.createElement('div');
            var currentIndex = this.getCurrentIndex();
            var contentTable = this.getContentTable()[0];
            var colGroup = $(contentTable).find("colgroup").first();
            var rowHeight = this.getRowHeight();
            colGroup.replaceWith(this._getMetaColGroup());
           (this.model.detailsTemplate != null || this.model.childGrid!=null)&& colGroup.prepend(this._getIndentCol());
            var tbody = contentTable.tBodies[0];
            var currentData = this.model.currentViewData;
            if (!ej.isNullOrUndefined(this._currentPageData)) {
                this._virtualLoadedRecords[this._currentPage()] = this._currentPageData;
                this._currentPageData = null;
            }
            else
                this._virtualLoadedRecords[this._currentPage()] = currentData;
            var elementTbody = $("<tbody></tbody>").append($.render[this._id + "_JSONTemplate"](currentData));
            var proxy = this;
            var $elementTbody = elementTbody.children("tr");
            if (this._allowcolumnSelection && this.selectedColumnIndexes.length > 0) {
                for (var index = 0; index < this.selectedColumnIndexes.length; index++) {
                    var ind = this.selectedColumnIndexes[index] + 1;
                    $elementTbody.find('td:nth-of-type(' + ind + ')').addClass("e-columnselection");
                }
            }
            this.virtualLoadedPages.push(currentIndex >= 0 ? currentIndex : 0);
            var orderedVirtualPages = ej.dataUtil.mergeSort(ej.distinct(this.virtualLoadedPages));
            $($elementTbody).attr('name', currentIndex);
            var minValue = ej.dataUtil.min(orderedVirtualPages);
            var maxValue = ej.dataUtil.max(orderedVirtualPages);
            $(tbody).children(".e-virtualrow").remove();
            for (var i = 0; i < orderedVirtualPages.length; i++) {
                var val = orderedVirtualPages[i];
                var pVal = orderedVirtualPages[i - 1];
                if (val != this.orderedVirtualLoadedPage[i] || this.orderedVirtualLoadedPage[i] == undefined) {
                    if (pVal != undefined)
                        $elementTbody.insertAfter($(tbody).children('[name=' + pVal + ']:last'));
                    else
                        $elementTbody.insertBefore($(tbody).children('[name=' + this.orderedVirtualLoadedPage[i] + ']:first'));
                    this.orderedVirtualLoadedPage = orderedVirtualPages;
                }
                if (val != 0) {
                    var prevValue = val == minValue ? minValue : pVal;
                    var middleRows = val - prevValue - proxy.model.pageSettings.pageSize;
                    if (middleRows > 0) {
                        var virtualTRMiddle = document.createElement("tr");
                        $(virtualTRMiddle).addClass("e-virtualrow").css("height", rowHeight * middleRows).insertBefore($(tbody).children('[name=' + val + ']:first'));
                    }
                }
                if (val == maxValue) {
                    var bottomRows = proxy._gridRecordsCount - maxValue - proxy.model.pageSettings.pageSize;
                    if (bottomRows > 0) {
                        var virtualTRBottom = document.createElement("tr");
                        $(virtualTRBottom).addClass("e-virtualrow").css("height", rowHeight * bottomRows).appendTo(tbody);
                    }
                }
            }
            if (minValue > 0) {
                var virtualTRTop = document.createElement("tr");
                $(virtualTRTop).addClass("e-virtualrow").css("height", rowHeight * minValue).prependTo(tbody);
            }
            var $content = this.getContent();
            var focusTR = $(tbody).children("tr[name=" + currentIndex + "]")[0];
            var focusPrev = focusTR.previousSibling;
            var con = $content.height();
            var focus = focusTR.offsetTop
            if (this._virtaulUnSel) {
                var virtualClone = $.extend(true, [], this._virtaulUnSel);
                for (var i = 0; i < virtualClone.length; i++) {
                    var row = virtualClone[i];
                    var page = this.model.pageSettings.currentPage;
                    var corresPage = row % this.model.pageSettings.pageSize == 0 ? parseInt(row / this.model.pageSettings.pageSize) : parseInt(row / this.model.pageSettings.pageSize) + 1;
                    if (corresPage == page) {
                        var index = row % this.model.pageSettings.pageSize;
                        var $row = $(tbody).find("tr[name=" + currentIndex + "]").eq(index);
                        $row.attr("aria-selected", "true").find('.e-rowcell, .e-detailrowcollapse, .e-detailrowexpand').addClass("e-selectionbackground e-active");
                        var removeIndex = this._virtaulUnSel.indexOf(row);
                        if (removeIndex != -1)
                            this._virtaulUnSel.splice(removeIndex, 1);
                    }
                }
            }
            if ((focusTR && focusPrev && ((this._virIndex || $(focusPrev).hasClass("e-virtualrow")) || focusPrev.offsetTop > (currentIndex * con))
            && (this._gridRecordsCount - currentIndex >= this.model.pageSettings.pageSize || focusTR.offsetParent.offsetHeight - focus < con)) || this._lastRow) {
                if (this._lastRow) this._lastRow = false;
                if (this._virIndex) this._virIndex = false;
                this._isVirtualRecordsLoaded = true;
                //this.getContent().children("div").first().scrollTop(this.getContent().find(".content").scrollTop() - (this.getContent().find(".content").scrollTop() - focusTR.offsetTop));
                $content.find(".e-content").scrollTop(focus);
                this._scrollValue = this.getContent()[0].firstChild.scrollTop;
            }
            var $contentTableTr = $(contentTable).get(0);
            var tFirst = temp.firstChild;
            this._currentJsonData = currentData;
            this._gridRows = $(contentTable).get(0).rows;
            var lastVirtualRow = $(contentTable).find(".e-virtualrow").last();
            var lastVirtualRowHeight = this.model.scrollSettings.virtualScrollMode == "normal" ? (lastVirtualRow.height() - ($(contentTable).height() - (this._gridRecordsCount * rowHeight))) : 1;
            lastVirtualRow.css("height", lastVirtualRowHeight);
            this._eventBindings();
        },
		_replacingVirtualContent: function () {                  
            var contentTable = this.getContentTable()[0];                            
            var currentLoadedIndexes = this._currentLoadedIndexes;            
            var tempTbody = $("<tbody></tbody>");		                   
            if (this._checkCurrentVirtualView(this._virtualLoadedRows, this._currentVirtualIndex)) {
				var currentRows = [];
                for (var i = 0; i < currentLoadedIndexes.length; i++) {
					$.merge(currentRows, this._virtualLoadedRows[currentLoadedIndexes[i]]);                    					
                }
				$(tempTbody).append(currentRows);
            }
            else {
				var elementTbody = $("<tbody></tbody>"); 				
                for (var i = 0; i < currentLoadedIndexes.length; i++) {					
                    var currentIndex = currentLoadedIndexes[i], virtualRow = this._virtualLoadedRows[currentIndex];                  
                    if (!virtualRow) {
                        var elementTbody = $("<tbody></tbody>").append($.render[this._id + "_JSONTemplate"](this._virtualLoadedRecords[currentIndex]));                        
                        var $elementTbody = elementTbody[0].rows, length = $elementTbody.length - 1;                        
                        $($elementTbody[length]).addClass("e-virtualview" + currentIndex);
						var hex = currentIndex.toString(32);
                        var vRows = $($elementTbody).attr('name', hex);                        
                        if (vRows.length == this._virtualRowCount || currentIndex == this._totalVirtualViews){
                            this._virtualLoadedRows[currentIndex] = vRows;
                            tempTbody.append($elementTbody);
                        }
                    }
                    else {
                        if (currentIndex < this._currentVirtualIndex) {
                            var vRow = tempTbody.find(".e-virtualview" + currentIndex);
                            if (vRow.length)
                                $(virtualRow).insertBefore(vRow);
                            else
                                tempTbody.prepend(virtualRow);
                        }
                        else
                            $(virtualRow).insertAfter(tempTbody.find(".e-virtualview" + (currentIndex - 1)));
                    }					
                }				
            }						   						
            contentTable.replaceChild(tempTbody[0], contentTable.lastChild);           
            $(contentTable.rows).removeClass("e-hover");
			this._setVirtualTopBottom();
			if(this._isThumbScroll || this._remoteRefresh){				
				//this._scrollObject.refresh();				
				this._scrollObject._content[0].scrollTop = this._scrollObject.scrollTop();
                this._isThumbScroll = this._remoteRefresh = false;
            }
			if(this.model.allowSelection)							
				this._checkVirtualSelection();																						
			this._gridRows = contentTable.rows;
			if(!this._checkCurrentVirtualView(this._queryCellView, this._currentVirtualIndex))            
				this._eventBindings();			
			if(this.model.queryCellInfo || this.model.rowDataBound){
				for(var i = 0; i < this._currentLoadedIndexes.length; i++){
					if($.inArray(this._currentLoadedIndexes[i], this._queryCellView) == -1)
						this._queryCellView.push(this._currentLoadedIndexes[i]);						
				}
			}
        },
		_setVirtualTopBottom: function(){
			var contentTable = this.getContentTable()[0];
			var rowHeight = this._vRowHeight;
			var orderedVirtualNames = ej.dataUtil.mergeSort(ej.distinct(this._currentLoadedIndexes));				
			var minValue = ej.dataUtil.min(orderedVirtualNames);
			var maxValue = ej.dataUtil.max(orderedVirtualNames);
			var recordsCount = this._getVirtualTotalRecord(), botHeight, maxViewValue;
			if(this.model.scrollSettings.virtualScrollMode == "continuous" && this._virtualLoadedRows[maxValue + 1]	){
				var keys = Object.keys(this._virtualLoadedRows);
				maxViewValue =  parseInt(ej.dataUtil.max(keys), 10);
				maxValue = maxViewValue - maxValue;
			}			
			botHeight = (maxValue * this._virtualRowCount * rowHeight);
			if($.inArray(this._totalVirtualViews, this._currentLoadedIndexes) != -1 && this._currentVirtualIndex != this._totalVirtualViews)
				botHeight = (recordsCount - (this._virtualRowCount - this._lastViewData)) * rowHeight;										
			var vBot = (recordsCount * rowHeight) - botHeight;	
			if(this.model.scrollSettings.virtualScrollMode == "continuous" && !this._virtualLoadedRows[maxValue + 1]){				
				vBot = maxViewValue && maxViewValue <=  maxValue + 1 ? vBot : 1;			 				
			}
			this.getContent().find(".e-virtualtop, .e-virtualbottom").remove();
			var max = 1000000;							
			if (vBot > 0 && this._getVirtualTotalRecord() > this._virtualRowCount * 2){ 
				if(Math.round(vBot).toString().length < 7)
					ej.buildTag("div.e-virtualbottom", "", { height: vBot }).insertAfter(contentTable);
				else {					
					ej.buildTag("div.e-virtualbottom").insertAfter(contentTable);
					var length = Math.ceil(vBot / max);
					for(var i = 0; i < length; i++){
						var divHeight = max;
						if(i == length - 1) divHeight = vBot % max;
						$(contentTable).next().append(ej.buildTag("div", "", { height: divHeight }));
					}
				}							
			}
			if (minValue > 1) {				
				var vTop =  (minValue - 1) * this._virtualRowCount * rowHeight;																	
				if(Math.round(vTop).toString().length < 7)
					ej.buildTag("div.e-virtualtop", "", { height: vTop }).insertBefore(contentTable);			
				else {					
					ej.buildTag("div.e-virtualtop").insertBefore(contentTable);
					var length = Math.ceil(vTop / max);
					for(var i = 0; i < length; i++){
						var divHeight = max;
						if(i == length - 1) divHeight = vTop % max;
						$(contentTable).prev().append(ej.buildTag("div", "", { height: divHeight }));
					}
				}								
			}      				
			if(this._scrollObject.model.scrollTop != this._scrollValue)
				this.getContent().ejScroller("model.scrollTop", this._scrollValue);				
        },
		_checkVirtualSelection: function(){
			var contentTable = this.getContentTable()[0];
			for(var i = 0; i < this.selectedRowsIndexes.length; i++){
				var selectedIndex = this.selectedRowsIndexes[i];
				var viewIndex = this._getSelectedViewData(selectedIndex).viewIndex;
				if($.inArray(viewIndex, this._currentLoadedIndexes) != -1){					
					var selIndex = selectedIndex % this._virtualRowCount + this._currentLoadedIndexes.indexOf(viewIndex) * this._virtualRowCount;	
					if(!$(contentTable.rows[selIndex].cells).hasClass("e-selectionbackground")){
						$($(contentTable.rows[selIndex]).attr("aria-selected", "true")[0].cells).addClass("e-selectionbackground e-active");							
						this.model.selectedRecords[i] = this._virtualLoadedRecords[viewIndex][selIndex % this._virtualRowCount];
					}
				}
			}
			for(var i = 0; i < this._rowIndexesColl.length; i++){
				var selectedIndex = this._rowIndexesColl[i];
				var viewIndex = this._getSelectedViewData(selectedIndex).viewIndex;
				if(($.inArray(viewIndex, this._currentLoadedIndexes) != -1 && $.inArray(selectedIndex, this._virtualRowCellSelIndex) == -1) || this._virtualDataRefresh){
					var curIndex = $.inArray(selectedIndex, this._rowIndexesColl);
					var cellIndexes = this.selectedRowCellIndexes[curIndex].cellIndex;
					for(var j = 0; j < cellIndexes.length; j++)
						this._selectMultipleCells(selectedIndex, cellIndexes[j]);						
				}
			}
			var selectedRows = $(contentTable.rows).find(".e-active, .e-cellselectionbackground").closest("tr");
			for(var i = 0; i < selectedRows.length; i++){
				var limit = parseInt($(selectedRows[i]).attr("name"), 32) * this._virtualRowCount;
				var remain = this._virtualRowCount - $(selectedRows[i]).index() % this._virtualRowCount;	
				var current = limit - remain;
				var rowIndex = $(selectedRows[i]).index();
				if(this.selectedRowsIndexes.length && $.inArray(current, this.selectedRowsIndexes) == -1){
					this._clearVirtualSelection = true;
					this.clearSelection(rowIndex);					
				}				
				if(this._rowIndexesColl.length && $.inArray(current, this._rowIndexesColl) == - 1)											
					$(this.getRowByIndex(rowIndex)[0].cells).removeClass("e-cellselectionbackground e-activecell");											
			}	
			$(contentTable.rows).find('.e-columnselection').removeClass('e-columnselection');
            for (var index = 0; index < this.selectedColumnIndexes.length; index++) {
				var ind = this.selectedColumnIndexes[index] + 1;
                $(contentTable.rows).find('td:nth-of-type(' + ind + ')').addClass("e-columnselection");
            }  				
			this._clearVirtualSelection = false;
		},
        _refreshPagerTotalRecordsCount: function () {
            if (this.model.filterSettings.filteredColumns.length)
                this.getPager().ejPager({ totalRecordsCount: this._searchCount == null ? this._filteredRecordsCount : this._searchCount, currentPage: this._currentPage() });
            else
                this.getPager().ejPager({ totalRecordsCount: this._searchCount == null ? this._gridRecordsCount : this._searchCount, currentPage: this._currentPage() });
        },
        _maxZindex: function () {
            var maxZ = 1;
            maxZ = Math.max.apply(null, $.map($('body *'), function (e, n) {
                if ($(e).css('position') == 'absolute')
                    return parseInt($(e).css('z-index')) || 1;
            }));
            if (maxZ == undefined || maxZ == null)
                maxZ = 1;
            return maxZ;
        },
        _keyPressed: function (action, target, e, event) {
            var $target = $(target);
            if ($target.hasClass('e-tooltxt') && e.code == 13) {
                var args = { currentTarget: target, target: target.firstChild }, $toolbar = $(target).closest(".e-gridtoolbar");
                $toolbar.ejToolbar("instance")._trigger("click", args);
                return false;
            }
            if(this._allowcellSelection && !(this._previousRowCellIndex && this._previousRowCellIndex.length != 0)){		
				this._previousRowCellIndex = [];
				this._previousRowCellIndex.push([0, [0]]);
			}
            if ($target.hasClass('e-ddl') && e.code == 13 && $(document.activeElement).parents('td').hasClass("e-templatecell") )
            return true;
            if (!this.model.allowKeyboardNavigation || (target.tagName == 'INPUT' && this.model.keyConfigs[action].indexOf(",") == -1 && e.code != 40 && e.code != 38 && e.code != 13 && e.code != 27 && e.code != 9) || String.fromCharCode(e.code).toLowerCase() == this.element[0].accessKey.toLowerCase())
                return true;
            if ($(target).prop("type") == "checkbox" && (e.code != 13 && e.code != 9 && e.code!=27))
                return true;
            if (this.model.editSettings.editMode == "batch" && (target.tagName == 'INPUT' && e.code != 13 && e.code != 9 && e.code!=27) && ((target.selectionStart != 0 && action != "moveCellRight") || (target.selectionEnd != target.value.length && action != "moveCellLeft")))
				return true;
            if (this.model.allowFiltering && ($target.hasClass('e-filtertext') && e.code == 13) || ($target.hasClass('e-fltrbtn') && e.code == 13))
                return true;
            if ((this.model.editSettings.editMode == "dialog" || this.model.editSettings.editMode == "dialogtemplate") && $(target).closest("#" + this._id + "EditForm").length)
                return true;
            else if ($(target).parent().siblings("#" + this._id + "EditForm").length)
                return true;
            if (e.code == 13 && $target.parent().hasClass("e-unboundcelldiv"))
                return true;
            if (e.code == 13 && target.tagName == 'INPUT' && $target.closest("#" + this._id + "_search").length)
                action = "searchRequest";
            if (e.code == 13 && $(target).hasClass("e-gridtoolbar")) {
                toolbarId = $target.find(".e-hover").attr("Id");
                action = "toolbarOperationRequest";
            }
            if ($(target).find("input.e-dropdownlist").attr("aria-expanded") == "true" && this.model.isEdit && action == "saveRequest")
                return true;
            if (this.getPager() != null)
                var pager = this.getPager().ejPager("model"), pageIndex = pager.currentPage;
            var returnValue = false, curEl, $target = $(target);
            if ($target.closest(".e-grid").attr("Id") !== this._id)
                return;
            switch (action) {
                case "insertRecord":
                    if (ej.gridFeatures.edit)
                        this._toolbarOperation(this._id + "_add");
                    break;
                case "toolbarOperationRequest":
                    this._toolbarOperation(toolbarId);
                    this.element.focus();
                    break;
                case "searchRequest":
                    this.search($target.val());
                    break;
                case "saveRequest":
                    if (ej.gridFeatures.edit) {
                        $target.blur();
                        if (this.model.editSettings.editMode == "batch") {
                            var tr = $(this.getRowByIndex(this._bulkEditCellDetails.rowIndex))
                            if(this.model.isEdit && tr.hasClass('e-insertedrow'))
                                this._batchCellValidation(this._bulkEditCellDetails.rowIndex);
                            this._moveCurrentCell("down");
                        }
                        else
                            this._toolbarOperation(this._id + "_update");
                            event.stopPropagation();
                    }
                    break;
                case "cancelRequest":
                    if (ej.gridFeatures.edit)
                        this._toolbarOperation(this._id + "_cancel");
                    break;
                case "deleteRecord":
                    if (ej.gridFeatures.edit)
                        this._toolbarOperation(this._id + "_delete");
                    break;
                case "editRecord":
                    if (ej.gridFeatures.edit)
                        this._toolbarOperation(this._id + "_edit");
                    break;
                case "totalGroupCollapse":
                    if (ej.gridFeatures.group) {
                        this.collapseAll();
                        this.element.focus();
                    }
                    break;
                case "totalGroupExpand":
                    if (ej.gridFeatures.group) {
                        this.expandAll();
                        this.element.focus();
                    }
                    break;
                case "selectedGroupExpand":
                    if (ej.gridFeatures.group) {
                        this._$currentTr = $(this.getRows()).eq(this._selectedRow());
                        curEl = this._$currentTr.parents("tr").first().prev().find(".e-recordpluscollapse");
                        this.expandCollapse(curEl);
                    }
                    break;
                case "selectedGroupCollapse":
                    if (ej.gridFeatures.group) {
                        this._$currentTr = $(this.getRows()).eq(this._selectedRow());
                        curEl = this._$currentTr.parents("tr").first().prev().find(".e-recordplusexpand");
                        this.expandCollapse(curEl);
                    }
                    break;
                case "firstRowSelection":
                    if (ej.gridFeatures.selection)
                        this.selectRows(0);
                    break;
                case "lastRowSelection":
                    if (ej.gridFeatures.selection)
                        if (this.model.scrollSettings.frozenColumns > 0 && !ej.isNullOrUndefined(this.getRows()[0]))
                            lastRow = $(this._excludeDetailRows()[0]).length - 1;
                        else
                            lastRow = $(this._excludeDetailRows()).length - 1;
                        this.selectRows(lastRow);
                    break;
                case "upArrow":
					if( this.model.isEdit && $target.hasClass('e-ddl'))
						break;
					if (ej.gridFeatures.selection && (this._selectedRow() != -1 || this._previousRowCellIndex != undefined) && (this.element.is(document.activeElement)|| this.element.find(document.activeElement).not(".e-gridtoolbar").length)) {
                        if ((target["type"] == "text" || target["type"] == "checkbox") && this.model.isEdit && this.model.editSettings.editMode != "batch")
                            return true;
						if (this._selectedRow() > 0 && !this.model.scrollSettings.enableVirtualization) {
                            this.selectRows(this._selectedRow() - 1);
                            if (this.model.editSettings.editMode == "batch")
                                this._moveCurrentCell("up");
                        }
                        if (this._previousRowCellIndex && this._previousRowCellIndex.length != 0 && this._previousRowCellIndex[0][0] != 0 && this._allowcellSelection) {
                            this.selectCells([[this._previousRowCellIndex[0][0] - 1, this._previousRowCellIndex[0][1]]]);
                            if (this.model.editSettings.editMode == "batch")
                                this._moveCurrentCell("down");
                        }
                    }
                    break;
                case "downArrow":
					if( this.model.isEdit && $target.hasClass('e-ddl'))
						break;
					if (ej.gridFeatures.selection && (this.element.is(document.activeElement)|| this.element.find(document.activeElement).not(".e-gridtoolbar").length)) {
                        if ((target["type"] == "text" || target["type"] == "checkbox") && this.model.isEdit && this.model.editSettings.editMode != "batch")
                            return true;
                        if(this._selectedRow() == -1)
							this.model.selectedRowIndex=0;
                        var lastRow = this._excludeDetailRows().length - 1;
                        if (this.model.scrollSettings.frozenColumns > 0 && !ej.isNullOrUndefined(this.getRows()[0]))
                            lastRow = this.getRows()[0].length - 1;
                        if (this._selectedRow() != lastRow && this._selectedRow() != -1 && !this.model.scrollSettings.enableVirtualization) {
                            this.selectRows(this._selectedRow() + 1);
                            if (this.model.editSettings.editMode == "batch")
                                this._moveCurrentCell("down");
                        }
                        if (this._previousRowCellIndex && this._previousRowCellIndex.length != 0 && this._previousRowCellIndex[0][0] != lastRow && this._allowcellSelection) {
                            this.selectCells([[this._previousRowCellIndex[0][0] + 1, this._previousRowCellIndex[0][1]]]);
                            if (this.model.editSettings.editMode == "batch")
                                this._moveCurrentCell("down");
                        }
                    }
                    break;
                case "rightArrow":
                    if (ej.gridFeatures.selection && this._allowcellSelection && (this.element.is(document.activeElement)|| this.element.find(document.activeElement).not(".e-gridtoolbar").length)) {
                        if ((target["type"] == "text" || target["type"] == "checkbox") && this.model.isEdit && this.model.editSettings.editMode != "batch")
                            return true;
                        var lastRow = $(this.getRows()).length - 1;
                        if (this._previousRowCellIndex && this._previousRowCellIndex[0][1] == this.model.columns.length - 1 && this._previousRowCellIndex[0][0] != lastRow) {
                            this.selectCells([[this._previousRowCellIndex[0][0] + 1, [0]]]);
                        } else if (this._previousRowCellIndex && this._previousRowCellIndex[0][1] != this.model.columns.length - 1)
                            this.selectCells([[this._previousRowCellIndex[0][0], [parseInt(this._previousRowCellIndex[0][1]) + 1]]]);

                    }
                    break;
                case "leftArrow":
                    if (ej.gridFeatures.selection && this._allowcellSelection && (this.element.is(document.activeElement)|| this.element.find(document.activeElement).not(".e-gridtoolbar").length)) {
                        if ((target["type"] == "text" || target["type"] == "checkbox") && this.model.isEdit && this.model.editSettings.editMode != "batch")
                            return true;
                        if (this._previousRowCellIndex && this._previousRowCellIndex[0][1] == 0 && this._previousRowCellIndex[0][0] != 0)
                            this.selectCells([[this._previousRowCellIndex[0][0] - 1, [this.model.columns.length - 1]]]);
                        else if (this._previousRowCellIndex && this._previousRowCellIndex[0][1] != 0)
                            this.selectCells([[this._previousRowCellIndex[0][0], [parseInt(this._previousRowCellIndex[0][1]) - 1]]]);

                    }
                    break;
                case "firstCellSelection":
                    if (ej.gridFeatures.selection && this._allowcellSelection) {
                        if ((target["type"] == "text" || target["type"] == "checkbox") && this.model.isEdit && this.model.editSettings.editMode != "batch")
                            return true;
                        var lastRow = $(this.getRows()).length - 1;
                        lastRow > -1 && this.selectCells([[0, [0]]]);
                    }
                    break;
                case "lastCellSelection":
                    if (ej.gridFeatures.selection && this._allowcellSelection) {
                        if ((target["type"] == "text" || target["type"] == "checkbox") && this.model.isEdit && this.model.editSettings.editMode != "batch")
                            return true;
                        if (this.model.scrollSettings.frozenColumns > 0 && !ej.isNullOrUndefined(this.getRows()[0]))
                            var lastRow = this._excludeDetailRows()[0].length - 1;
                        else
                            lastRow = $(this._excludeDetailRows()).length - 1;
                        lastRow > -1 && this.selectCells([[lastRow, [this.model.columns.length - 1]]]);
                    }
                    break;
                case "nextPage":
                    if (this.getPager() != null)
                        pageIndex = pageIndex + 1;
                    if (this.getBrowserDetails().browser == "msie")
                        this.element.focus();
                    break;
                case "previousPage":
                    if (this.getPager() != null)
                        pageIndex = pageIndex - 1;
                    if (this.getBrowserDetails().browser == "msie")
                        this.element.focus();
                    break;
                case "lastPage":
                    if (this.getPager() != null)
                        pageIndex = pager.totalPages;
                    break;
                case "firstPage":
                    if (this.getPager() != null)
                        pageIndex = 1;
                    break;
                case "nextPager":
                    if (this.getPager() != null)
                        pageIndex = Math.ceil(pager.currentPage / pager.pageCount) * pager.pageCount + 1;
                    break;
                case "previousPager":
                    if (this.getPager() != null)
                        pageIndex = (Math.floor(pager.currentPage / pager.pageCount) - 1) * pager.pageCount + 1;
                    break;
                case "moveCellLeft":
                    if (this.model.editSettings.editMode == "batch"){
						this._tabKey = true;
                        returnValue = this._moveCurrentCell("left");
					}
                    else
                        returnValue = true;
                    break;
                case "moveCellRight":
                    if (this.model.editSettings.editMode == "batch" && $target){
						this._tabKey = true;
                        returnValue = this._moveCurrentCell("right");
					}
                    else
                        returnValue = true;
                    break;
                case "multiSelectionByDownArrow":
                    if (ej.gridFeatures.selection && (this._selectedRow() != -1 || this._previousRowCellIndex != undefined)) {
                        var lastRow = this._excludeDetailRows().length - 1, $target = this.element.find('.e-gridcontent').find('.e-rowcell');
                        if (this.model.scrollSettings.frozenColumns > 0 && !ej.isNullOrUndefined(this.getRows()[0]))
                            lastRow = this.getRows()[0].length - 1;
                        if (this._selectedRow() <= lastRow && this._selectedRow() != -1) {
                            var selectedRow = this._selectedRow() + 1, fromIndex = this._previousIndex;
                            this.selectRows(fromIndex, selectedRow, $target);
                            if ((selectedRow - 1) == lastRow) {
                                this.selectRows(fromIndex, lastRow);
                                selectedRow = lastRow;
                            }
                        }
                        this._selectedRow(selectedRow);
                        this._previousIndex = fromIndex;
                    }
                    this.model.editSettings.editMode == "batch" && this.element.focus();
                    break;
                case "multiSelectionByUpArrow":
                    var firstRow = 0;
                    if (ej.gridFeatures.selection && (this._selectedRow() != -1 || this._previousRowCellIndex != undefined)) {
                        var lastRow = this._excludeDetailRows().length - 1, $target = this.element.find('.e-gridcontent').find('.e-rowcell');
                        if (this._selectedRow() >= 0 && this._selectedRow() >= -1) {

                            var selectedRow = this._selectedRow() - 1, fromIndex = this._previousIndex;
                            this.selectRows(fromIndex, selectedRow, $target);
                            if (selectedRow < 0) {
                                this.selectRows(fromIndex, firstRow);
                                selectedRow = firstRow;
                            }
                        }
                        this._selectedRow(selectedRow);
                        this._previousIndex = fromIndex;
                    }
                    this.model.editSettings.editMode == "batch" && this.element.focus();
                    break;
                default:
                    returnValue = true;
            }
            if (this.getPager() != null && pageIndex <= pager.totalPages && pager.currentPage !== pageIndex && action != "searchRequest" && action !== "deleteRecord")
                this.getPager().ejPager("goToPage", pageIndex);
            return returnValue;
        },
        _findColumnsWidth: function () {
            var j = this.getHeaderTable().find(".e-headercell").not(".e-stackedHeaderCell, .e-detailheadercell"), index = 0;           
            for (var i = 0; i < this.model.columns.length; i++) {
                if (this.model.columns[i]["visible"])
                    this.columnsWidthCollection[i] = j.eq(i + index).outerWidth();
            }
        },
        _calculateWidth: function () {
            var j = this.getHeaderTable().find(".e-columnheader").last().find("th:visible"), width = 0;
            for (var i = 0; i < j.length; i++)
                width += j.eq(i).outerWidth();
            return width;

        },
        _initIndicators: function () {
            var indicatorId = this._id + "_ColumnDropIndicator";
            if ($("#" + indicatorId).length)
                $("#" + indicatorId).remove();
            this._Indicator = document.createElement("DIV");
            $(this._Indicator).attr('id', indicatorId).addClass("e-columndropindicator").addClass("e-dropAcceptor").appendTo(document.body);
            $(this._Indicator).css({ "display": "none" });

        },
        _refreshGroupSummary: function () {
            var headerCols = this.getHeaderContent().find("colgroup col").clone();
            headerCols.splice(0, this.model.groupSettings.groupedColumns.length);
            var $gsColgroup = this.getContentTable().find(".e-groupsummary colgroup");
            for (var i = 0; i < $gsColgroup.length; i++) {
                if (!$($gsColgroup[i]).find(".e-summary").is("visible"))
                    $($gsColgroup[i]).find(".e-summary").show();
                $($gsColgroup[i]).find("col:not('.e-summary')").remove();
                $($gsColgroup[i]).append(headerCols.clone());
            }
        },
        
        reorderColumns: function (fromfname, tofname) {
            var fromindex = this.model.columns.indexOf(this.getColumnByField(fromfname));
            var toindex = this.model.columns.indexOf(this.getColumnByField(tofname));
            if (fromindex == -1 || toindex == -1) return;
            this.set_dropColumn(fromindex, toindex);
            if (this.model.showStackedHeader)
                this._refreshStackedHeader();
            if (this.model.scrollSettings.allowVirtualScrolling){
				if(this.model.scrollSettings.enableVirtualization){
					this._virtualDataRefresh = true;
					this._queryCellView = [];
					this._virtualLoadedRows = {};
					this._refreshVirtualView(this._currentVirtualIndex);								
				}
				else
					this._refreshVirtualContent(); 
			}
        },
        
        columns: function (details, action) {
            if (ej.isNullOrUndefined(details)) return;
            var isString = false;
            if (typeof details === "string") {
                details = [details];
                isString = true;
            }
            else if (details instanceof Array && details.length && typeof details[0] === "string")
                isString = true;
            for (i = 0; i < details.length; i++) {
                var field = isString ? details[i] : details[i].field, headerText = isString ? details[i] : details[i].headerText, index;
                if ((ej.isNullOrUndefined(field) || field == "") && (ej.isNullOrUndefined(headerText) || headerText == ""))
                    index = -1;
                else if (ej.isNullOrUndefined(field) || field == "")
                    index = $.inArray(this.getColumnByHeaderText(headerText), this.model.columns);
                else
                    index = $.inArray(this.getColumnByField(field), this.model.columns);
                if (action == "add" || ej.isNullOrUndefined(action)) {
                    if (index == -1)
                        this.model.columns.push(isString ? { field: details[i] } : details[i]);
                    else
                        this.model.columns[index] = isString ? { field: details[i] } : details[i];
                }
                else {
                    if (index != -1)
                        this.model.columns.splice(index, 1);
                }
            }            
            this.columnsWidthCollection = [], tooltip = false;
            for (var columnCount = 0; columnCount < this.model.columns.length; columnCount++) {
                this.columnsWidthCollection.push(this.model.columns[columnCount]["width"]);
                if (!ej.isNullOrUndefined(tooltip))
                    tooltip = true;
            }
            this._enableRowHover(tooltip);
            this._refreshHeader();
			if (this.model.editSettings.allowEditing || this.model.editSettings.allowAdding) 
				this._processEditing();
            this.refreshContent(true);
            if (this.model.allowScrolling) {
                this.refreshScrollerEvent();
                if (this.model.allowResizeToFit && this.getContent().ejScroller("isVScroll"))
                    this._showHideScroller();
            }
        },
        _enableRowHover: function (isTooltip) {
            var tooltip = true;
            if (ej.isNullOrUndefined(isTooltip)) {
                for (var i = 0 ; i < this.model.columns.length; i++) {
                    if (!ej.isNullOrUndefined(this.model.columns[i]['tooltip'])) {
                        tooltip = true;
                        break;
                    }
                }
            }
            else
                tooltip = isTooltip;
            if (this.model.enableRowHover || tooltip)
                this._on(this.element, "mouseenter mouseleave", ".e-gridcontent tr td", this._rowHover);
            else
                this._off(this.element, "mouseenter mouseleave", ".e-gridcontent tr td");
        },
        _rowHover: function (e) {
            var $target = $(e.target);
            if (this.model.scrollSettings.frozenColumns)
                var $gridRows = $(this.getRows());
            else
                var $gridRows = this.element.find(".e-row.e-hover,.e-alt_row.e-hover");
            if (($target.closest("#" + this._id + "EditForm").length && $target.hasClass("e-rowcell")) || !$target.hasClass("e-rowcell"))
                return;
            if (e.type == "mouseenter" && $target.hasClass("e-gridtooltip"))
                this._showTooltip($target);
            if (this.model.enableRowHover) {
                if (e.type == "mouseenter" && !this._dragActive) {
                     if (this.model.scrollSettings.frozenColumns > 0 && !ej.isNullOrUndefined($gridRows[0]) && !ej.isNullOrUndefined($gridRows[1]))	
					 {
						$gridRows = $($gridRows[0]).add($gridRows[1]);
						$gridRows.removeClass("e-hover");
						var index = this.getIndexByRow($target.parent());
						index != -1 && this.getRowByIndex(index).addClass("e-hover");
					}
                 else {
                     $gridRows.removeClass("e-hover");
                     if( $target.parent().hasClass('e-row') ||$target.parent().hasClass ('e-alt_row'))
                         $target.parent().addClass("e-hover");
					}
                } else {
                    if (this.model.scrollSettings.frozenColumns > 0 && !ej.isNullOrUndefined($gridRows[0]) && !ej.isNullOrUndefined($gridRows[1]))
                        $gridRows = $($gridRows[0]).add($gridRows[1]);
                    $gridRows.removeClass("e-hover");
                }
            }
            return false;
        },
        _showTooltip: function ($target, isHeaderTooltip) {
            var index = $target.index(), isStack = $target.hasClass("e-stackedHeaderCell");
            if ($target.hasClass("e-headercelldiv"))
                index = $target.parent(".e-headercell").index() - this.model.groupSettings.groupedColumns.length;
            if (!isStack && (this.model.childGrid || this.model.detailsTemplate))
                index--;
            if (this.model.scrollSettings.frozenColumns > 0 && ($target.closest(".e-movableheaderdiv").length || $target.closest(".e-movablecontentdiv").length))
                index = index + this.model.scrollSettings.frozenColumns;
            var col =  !isStack ? this.getColumnByIndex(index) : this._getStackedColumnByTarget($target);            
            if (col["clipMode"] != ej.Grid.ClipMode.Ellipsis) {
                if (col["clipMode"] == ej.Grid.ClipMode.EllipsisWithTooltip) {
                    var td = $target;
                    if (!$target.find("span").hasClass("e-tooltip")) {
                        $span = ej.buildTag('span.e-tooltip', {}, {})
                        $span.html($target.html());
                        td.append($span);
                    }
                    td.find('span.e-tooltip').css('display', 'inline-block')
                    var width = td.find('span:first')[0].getBoundingClientRect().width;
                    td.find('span.e-tooltip').remove();
                    if ($target.width() > (width)) {
                        $target.removeAttr('title');
                        return;
                    }
                }

                var scriptElement = document.createElement("script");
                if (ej.isNullOrUndefined(col["tooltip"]) && ej.isNullOrUndefined(col["headerTooltip"]))
                    return;
                else {
                    var t;
                    scriptElement.id = (this._id + col.headerText + $.inArray(col, this.model.columns) + "_TemplateToolTip").split(" ").join("");
                    scriptElement.type = "text/x-template";
                    var tooltipType = !isHeaderTooltip ? "tooltip" : "headerTooltip";
                    if (!ej.isNullOrUndefined(col[tooltipType]) && col[tooltipType].slice(0, 1) !== "#")
                        scriptElement.text = col[tooltipType];
                    else
                        t = $(col[tooltipType]);
                    if (t) {
                        scriptElement.text = t.html();
                        scriptElement.type = t.attr("type") || scriptElement.type;
                    }
                    $("body").append(scriptElement);
                }
                var str = $(scriptElement).render({ value: $target.text() });
                $target.attr('title', str);
            }
            else
                $target.removeAttr('title');

        },
        _rightClickHandler: function (e) {
            e.preventDefault(); var browser = ej.browserInfo();
            if (e.which == 3 || (browser.name == "msie" && browser.version == "8.0")) {
                var args = {};
                $target = $(e.target);
                $gridRow = $(this.getRows());
                if (this.getContentTable().has($target).length) {
                    var index = $gridRow.index($target.parent());					
					var $row = this.getRowByIndex(index);
					var $data = this._currentJsonData[index];
					if(this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){	
						var viewDetails = this._getSelectedViewData(index, $target);					
						$data = viewDetails.data;				
						index = viewDetails.rowIndex;					
					}
                    if (index == -1)
                        return;
                    args = { rowIndex: index, row: $row, data: $data, cellIndex: $target.index(), cellValue: $target.html(), cell: $target };
                }
                else if (this.getHeaderTable().has($target).length) {
                    var index = 0
                    $th = this.getHeaderTable().find('th').not('.e-detailheadercell,.e-grouptopleftcell,.e-filterbarcell');
                    if ($target.is('.e-headercelldiv'))
                        index = $th.index($target.closest('.e-headercell'));
                    else
                        index = $th.index($target);
                    if (index == -1)
                        return;
                    args = { headerIndex: index, headerText: this.getColumnFieldNames()[index], headerCell: $th.eq(index), column: this.getColumnByIndex(index) }
                }
                else if ($target.is('.e-pager') || (this.getPager() != null && this.getPager().has($target).length)) {
                    args = { pager: this.model.pageSettings }
                }
                this._trigger("rightClick", args);
            }
        },
        _touchGrid: function (e) {
            var curPage = this._currentPage(), doPage = true;
            if (this.model.allowScrolling || (this.model.isResponsive && this.model.minWidth != 0)) {
                var d = (this.getScrollObject() || {})._scrollXdata;
                if (d)
                    doPage = e.type == "swipeleft" ? d.scrollable - d.sTop == 0 : d.sTop == 0;
            }
            switch (e.type) {
                case "swipeleft":
                    if (this.model.allowPaging && curPage != this.model.pageSettings.totalPages && !this.model.isEdit)
                        doPage && this.element.ejGrid("gotoPage", curPage + 1);
                    break;
                case "swiperight":
                    if (this.model.allowPaging && curPage > 1 && !this.model.isEdit)
                        doPage && this.element.ejGrid("gotoPage", curPage - 1);
                    break;
            }
        },
        _recorddblClickHandler: function (e) {
            var args = {}, $target = $(e.target).is(".e-rowcell") ? $(e.target) : $(e.target).closest("td");
            if ($target.closest(".e-grid").attr("id") !== this._id) return;
            if ((!$target.is('.e-rowcell') && !$target.closest("td").is(".e-rowcell")) || ($target.closest('.e-editcell,.e-editedbatchcell').length > 0))
                return;
            var index = this.getIndexByRow($target.closest('tr'));
			var $row = this.getRowByIndex(index);
			var $data = this._currentJsonData[index];
			if(this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){	
				var viewDetails = this._getSelectedViewData(index, $target);					
				$data = viewDetails.data;				
				index = viewDetails.rowIndex;					
			}
            var cellIndx = (this.model.detailsTemplate != null || this.model.childGrid != null) ? $target.index() - 1 : $target.index();
            args = { rowIndex: index, row: $row, data: $data, cell: $target, cellIndex: cellIndx, columnName: this.getColumnByIndex(cellIndx)["headerText"], cellValue: $target.text() };
            this._trigger("recordDoubleClick", args);
        },
        _recordClick: function (e) {
            var args = {}, $target = $(e.target).is(".e-rowcell") ? $(e.target) : $(e.target).closest("td");
            if ($target.closest(".e-grid").attr("id") !== this._id) return;
            if ((!$target.is('.e-rowcell') && !$target.closest("td").is(".e-rowcell")) || ($target.closest('.e-editcell,.e-editedbatchcell')).length > 0)
                return;
            var index = this.getIndexByRow($target.closest('tr'));
			var $row = this.getRowByIndex(index);
			var $data = this._currentJsonData[index];
			if(this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){	
				var viewDetails = this._getSelectedViewData(index, $target);					
				$data = viewDetails.data;				
				index = viewDetails.rowIndex;					
			}			 
            var cellIndx = (this.model.detailsTemplate != null || this.model.childGrid != null) ? $target.index() - 1 : $target.index();
            args = { rowIndex: index, row: $row, data: $data, cell: $target, cellIndex: cellIndx, columnName: this.getColumnByIndex(cellIndx)["headerText"], cellValue: $target.text() };
            this._trigger("recordClick", args);
        },
        _headerMouseDown: function (e) {
            if (($(e.target).hasClass("e-headercelldiv") && !$(e.target).parent().hasClass("e-grouptopleftcell")) || $(e.target).hasClass("e-headercell")) {
                var $headercell = $(e.target).hasClass("e-headercelldiv") ? $(e.target).parent() : $(e.target);
                this.model.enableHeaderHover && $headercell.removeClass("e-hover e-headercell-hover").addClass("e-headercellactive e-active");
            }
            if (this.model.allowResizing)
                return this._resizer._mouseDown(e);
        },
        _contentMouseDown: function (e) {
            if ($(e.target).closest("td").hasClass("e-selectionbackground"))
                return;
            if ($(e.target).closest("tr").length) {
                this._dragDiv = ej.buildTag("div.e-griddragarea", "", { "position": "absolute", "width": "0px", "height": "0px" })
                this.getContent().append(this._dragDiv);
                var tr = $(e.target).closest("tr.e-row");
                if (!tr.length)
                    tr = $(e.target).closest("tr.e-alt_row");
                this._startIndex = tr.length ? this.getIndexByRow(tr) : null;
                this._on(this.getContent(), "mousemove", this._mouseMoveDragHandler);
                this._on($(document), "mouseup", this._mouseUpDragHandler);
                this._startDrag = { _x: e.pageX, _y: e.pageY };
            }
        },
        _mouseMoveDragHandler: function (e) {
            if (e.which == 1 && e.pageY != this._startDrag._y) {
                this._selectDrag = true;
                var left = this._dragDiv[0].offsetLeft;
                var top = this._dragDiv[0].offsetTop;

                var x1 = this._startDrag._x,
                y1 = this._startDrag._y,
                x2 = e.pageX,
                y2 = e.pageY, tmp, eleLocation = e.pageY + 2;

                if (x1 > x2) { tmp = x2; x2 = x1; x1 = tmp; }
                if (y1 > y2) { tmp = y2; y2 = y1; y1 = tmp; eleLocation = e.pageY - 2 }
                var height = this._dragDiv.height();
                this._dragDiv.css({ left: x1, top: y1, width: x2 - x1, height: y2 - y1 });
                var element = $(document.elementFromPoint(e.pageX, eleLocation));
                var tr = element.closest("tr.e-row");
                if (!tr.length)
                    tr = element.closest("tr.e-alt_row");
                if (tr.length) {
                    this._endIndex = this.getIndexByRow(tr);
                    if (ej.isNullOrUndefined(this._startIndex))
                        this._startIndex = this._endIndex;
                    this.selectRows(this._startIndex, this._endIndex);
                }
            }
        },
        _mouseUpDragHandler: function (e) {
            this._off($(document), "mouseup", this._mouseUpDragHandler);
            this._off(this.getContent(), "mousemove", this._mouseMoveDragHandler);
            this._selectDrag = false;
            this._dragDiv.remove();
        },
        _headerHover: function (e) {
            var $target = $(e.target);
            if (e.type == "mouseover" || e.type == "mousemove" || e.type == "touchmove" || e.type == "MSPointerMove") {
                if (this.model.allowResizing || this.model.allowResizeToFit)
                    this._resizer._mouseHover(e);

                if (this.model.enableHeaderHover && !this._dragActive && (($target.hasClass("e-headercelldiv") && !$target.parent().hasClass("e-grouptopleftcell")) || $target.hasClass("e-headercell"))) {
                    if ($target.hasClass("e-headercelldiv"))
                        $target = $target.parent();
                    this.getHeaderTable().find(".e-columnheader").find(".e-headercell-hover").removeClass("e-headercell-hover").removeClass("e-hover");
                    $target.addClass("e-headercell-hover e-hover");
                }
                if ($target.hasClass("e-gridtooltip"))
                    this._showTooltip($target);
                if ($target.hasClass("e-headertooltip"))
                    this._showTooltip($target, true);
                if (e.type == "mouseover")
                    this._addCursor();
            } else
                this.model.enableHeaderHover && this.getHeaderTable().find(".e-columnheader").find(".e-headercell-hover").removeClass("e-headercell-hover").removeClass("e-hover");
        },
        _addCursor: function () {
            var flag = (this.model.allowResizing || this.model.allowResizeToFit || this.model.allowGrouping || this.model.allowFiltering || this.model.allowSorting || this.model.allowReordering || this.model.contextMenuSettings.enableContextMenu || this._allowcolumnSelection);
            if (!flag) {
                this.getHeaderTable().find(".e-columnheader").addClass("e-defaultcursor");
                this.getHeaderTable().find(".e-headercell").removeClass("e-defaultcursor");
            }
            else {
                this.getHeaderTable().find(".e-columnheader").removeClass("e-defaultcursor");
                if (!(this.model.contextMenuSettings.enableContextMenu || this.model.selectionSettings.selectionMode == "column")) {
                    var propArray = [{ val: this.model.allowSorting, str: "sort" }, { val: this.model.allowGrouping, str: "group" }, { val: this.model.allowReordering, str: "reorder" }, { val: this.model.allowFiltering, str: "filter" }];
                    var colpropcount = 0;
                    for (var i = 0; i < propArray.length; i++) {
                        if (propArray[i].val == false) {
                            propArray.splice(i, 1);
                            i--;
                        }
                    }

                    for (i = 0; i < this.model.columns.length && propArray.length > 0 ; i++) {
                        for (j = 0; j < propArray.length; j++) {
                            switch (propArray[j].str) {
                                case "sort":
                                    if (!ej.isNullOrUndefined(this.model.columns[i].allowSorting) && !this.model.columns[i].allowSorting)
                                        colpropcount++;
                                    break;
                                case "group":
                                    if (!ej.isNullOrUndefined(this.model.columns[i].allowGrouping) && !this.model.columns[i].allowGrouping)
                                        colpropcount++
                                    break;
                                case "reorder":
                                    if (!ej.isNullOrUndefined(this.model.columns[i].allowReordering) && !this.model.columns[i].allowReordering)
                                        colpropcount++
                                    break;
                                case "filter":
                                    if (!ej.isNullOrUndefined(this.model.columns[i].allowFiltering) && !this.model.columns[i].allowFiltering)
                                        colpropcount++;
                                    break;
                            }
                        }
						if(!ej.isNullOrUndefined(this.model.columns[i].template) || !ej.isNullOrUndefined(this.model.columns[i].templateID))
							isTempCol = true;
						else 
							isTempCol = false;
						if (colpropcount == propArray.length && !(isTempCol))
                            this.getHeaderTable().find(".e-headercell").eq(i).addClass("e-defaultcursor");
                        colpropcount = 0;
                    }
                }
            }
        },
        _colgroupRefresh: function () {
            if ((this.model.allowResizing || this.model.allowResizeToFit) && this.model.scrollSettings.frozenColumns > 0) {
                var gridheaderCol = $(this.getHeaderTable()).find('colgroup');
                var gridcontentCol = $(this.getContentTable()).find('colgroup');
            }
            else {
                var gridheaderCol = $(this.getHeaderTable()).find('colgroup')[0];
                var gridcontentCol = $(this.getContentTable()).find('colgroup')[0];
            }
            var headerColClone = $(gridheaderCol).clone();
            var contentColClone = $(gridcontentCol).clone();
            $(gridcontentCol).remove();
            $(gridheaderCol).remove();
            if ((this.model.allowResizing || this.model.allowResizeToFit) && this.model.scrollSettings.frozenColumns > 0) {
                $(headerColClone[0]).prependTo(this.getHeaderTable()[0]);
                $(headerColClone[1]).prependTo(this.getHeaderTable()[1]);
                $(contentColClone[0]).prependTo(this.getContentTable()[0]);
                $(contentColClone[1]).prependTo(this.getContentTable()[1]);
            }
            else {
                $(headerColClone).prependTo(this.getHeaderTable());
                $(contentColClone).prependTo(this.getContentTable());
            }
        },
        _detailColsRefresh: function () {
            this._$headerCols = this.getHeaderTable().children("colgroup").find("col");
            this._$contentCols = this.getContentTable().children("colgroup").find("col");
            var colCount = this.model.columns.length;
            if (this._$headerCols.length > colCount) this._$headerCols.splice(0, (this._$headerCols.length - colCount));
            if (this._$contentCols.length > colCount) this._$contentCols.splice(0, (this._$contentCols.length - colCount));
        },
        _summaryColRrefresh: function () {
            var table = this.getFooterContent().find('.e-gridsummary');
            for (var i = 0; i < this.columnsWidthCollection.length; i++) 
                table.find('col').eq(i).width(this.columnsWidthCollection[i]);
        },
        _headerdblClickHandler: function (e) {
            if (this.model.allowResizeToFit)
                this._resizer._columnResizeToFit(e);
            if (this.model.allowScrolling)			
                this.getScrollObject().refresh(this.model.scrollSettings.frozenColumns > 0);			
        },

        _mouseUp: function (e) {
            if (this.model.allowResizing)
                this._resizer._mouseUp(e);
        },

        _mouseMove: function (e) {
            if (this.model.allowResizing)
                this._resizer._mouseMove(e);
        },
        _setModel: function (options) {
            for (var prop in options) {
                switch (prop) {
                    case "enableResponsiveRow":
                        if (options[prop]) {
                            this.element.addClass("e-responsive");
                            if (this.model.minWidth) {
                                this._removeMedia();
                                this._scrollerAddedOnMedia = false;
                            }
                            if (this.model.allowFiltering) {
                                this.element.find('.e-filterDialoge').remove();
                                this._renderFilterDialogs();
                                this._renderResponsiveFilter();
                                this.element.find('.e-gridtoolbar').remove();
                            }
                        } else {
                            if (this.model.allowFiltering) {
                                $('body').find('.e-filterDialoge').remove();
                                this._renderFilterDialogs();
                            }
                            if (this.element.css("display") == "none")
                                this.element.css("display", "block");
                            this.element.removeClass("e-responsive");
                            if (this.model.minWidth)
                                this._addMedia();
                            if (this.model.allowScrolling) {
                                this.getScrollObject().refresh();
                                if (!this.getScrollObject().isVScroll()) {
                                    this.getHeaderContent().removeClass("e-scrollcss");
                                    this.getHeaderContent().find(".e-headercontent").removeClass("e-hscrollcss");
                                }
                                else if (this.getScrollObject().isVScroll()) {
                                    this.getHeaderContent().addClass("e-scrollcss");
                                    this.getHeaderContent().find(".e-headercontent").addClass("e-hscrollcss");
                                }
                            }
                        }
                        this._tdsOffsetWidth = [];
                        if (this.model.allowFiltering || this.model.allowSorting) {
                            var index = this.model.toolbarSettings.toolbarItems.indexOf('responsiveFilter');
                            index != -1 && this.model.toolbarSettings.toolbarItems.splice(index, 1);
                            var sortIndex = this.model.toolbarSettings.toolbarItems.indexOf('responsiveSorting');
                            sortIndex != -1 && this.model.toolbarSettings.toolbarItems.splice(sortIndex, 1);
                            this.element.find('.e-gridtoolbar').remove();
                            this._renderToolBar().insertBefore(this.element.find(".e-gridheader").first());
                        }
                        break;
                    case "showColumnChooser":
                        if (options[prop]) {
                            this._visibleColumns = [];
                            this._hiddenColumns = [];
                            this._visibleColumnsField = [];
                            this._hiddenColumnsField = [];
                            this._renderGridHeaderInternalDesign(this.model.columns);
                            this._renderColumnChooser();
                        }
                        else {
                            var ccBtnHeight = this.element.find(".e-ccButton").outerHeight();
                            this.element.find(".e-ccButton").remove();
                            $("#" + this._id + 'ccDiv_wrapper').remove();
                            this.element.css('margin-top', (parseInt(this.element.css('margin-top'), 10) - ccBtnHeight));
                        }
                        break;
                    case "gridLines":
                        this.getContent().removeClass("e-horizontallines e-verticallines e-hidelines");
						this.getHeaderContent().removeClass("e-horizontallines e-verticallines e-hidelines");
						this._showHeaderGridLines();
                        this._showGridLines();
                        break;
                    case "showDeleteConfirmDialog":
                        this.model.editSettings.showDeleteConfirmDialog = options[prop];
                        if (options[prop])
                            this._renderConfirmDialog();
                        else
                            this.element.find("#" + this._id + 'ConfirmDialog_wrapper').remove()
                        break;
                    case "showConfirmDialog":
                        this.model.editSettings.showConfirmDialog = options[prop];
                        if (options[prop])
                            this._renderConfirmDialog();
                        else
                            this.element.find("#" + this._id + 'ConfirmDialog_wrapper').remove()
                        break;
                    case "pageSettings":
                        var pageModel = this.getPager().ejPager("model");
                        if (ej.isNullOrUndefined(options[prop]["currentPage"]) || pageModel.currentPage != this._currentPage()) {
                            for (var pageProp in options[prop]) {
                                if (pageProp != "currentPage" && options[prop][pageProp] === pageModel[pageProp])
                                    delete options[prop][pageProp];
                            }
                            if ($.isEmptyObject(options[prop]))
                                break;
                            options[prop]["currentPage"] = this._currentPage();
                            this.getPager().ejPager("option", options[prop]);
                            this._renderPagerTemplate(this.getPager(), options[prop]["showDefaults"]);
                            this._currentPage(this._currentPage() > pageModel.totalPages ? pageModel.totalPages : this._currentPage());
                            this.refreshContent();
                        }
                        break;
                    case "columns":
                        var columns = options.columns;
                        this.model.columns = [];
                        this.columns(columns, "add");
                        break;
                    case "allowPaging":
                        this.model.allowPaging = options[prop];
                        if (options[prop] && this.element.children(".e-pager").length == 0) {
                            this.element.append(this._renderGridPager());
                            this.refreshContent();
                            this.getPager().ejPager("refreshPager");
                        } else {
                            this.getPager().remove();
                            this.setGridPager(null);
                            this.refreshContent();
                            if (this.model.filterSettings.filterType == "filterbar" && this.model.allowFiltering)
                                this._createPagerStatusBar();
                        }
                        break;
                    case "allowSearching":
                        this.model.allowSearching = options[prop];
                        break;
                    case "searchSettings":
                        $.extend(this.model.searchSetings, options[prop]);
                        this.refreshContent();
                        break;
                    case "allowGrouping":
                        if (options[prop] && this.element.children(".e-groupdroparea").length == 0) {
                            this.model.allowGrouping = options[prop];
                            this.addGroupingTemplate();
							this.model.showColumnChooser && this.element.find(".e-ccButton").length > 0 ? this.element.find(".e-ccButton").after(this._renderGroupDropArea()) : this.element.prepend(this._renderGroupDropArea());
                            this._enableGroupingEvents();
                            this._headerCellgDragDrop();
                            this._off(this.element, "mouseenter mouseleave", ".e-groupdroparea,.e-groupheadercell", this._dropAreaHover);
                            this._on(this.element, "mouseenter mouseleave", ".e-groupdroparea,.e-groupheadercell", this._dropAreaHover);
                        } else
                            this.element.children(".e-groupdroparea").remove();
                        if (this.model.allowGrouping) {
                            !ej.isNullOrUndefined(options["groupSettings"]) && $.extend(this.model.groupSettings, options["groupSettings"]);
                            this._enableGrouping();
                        }
                        
                        break;
                    case "groupSettings":
                        $.extend(this.model.groupSettings, options[prop]);
                        if(this.model.allowGrouping && ej.isNullOrUndefined(options["allowGrouping"]))
                            this._enableGrouping();
                        if(!ej.isNullOrUndefined(this.model.groupSettings.enableDropAreaAnimation))
                            this.model.groupSettings.enableDropAreaAutoSizing = this.model.groupSettings.enableDropAreaAnimation;
                        break;
                    case "cssClass":
                        this.element.removeClass(this.model.cssClass).addClass(options[prop]);
                        break;
                    case "allowFiltering":
                    case "filterSettings":
                        if (prop == "filterSettings")
                            $.extend(this.model.filterSettings, options[prop]);
                        else
                            this.model.allowFiltering = options[prop];
                        if (this._$fDlgIsOpen)
                            this._closeFDialog();
                        if (!this.model.allowFiltering) {
                            if (this.model.filterSettings.filterType == ej.Grid.FilterType.FilterBar)
                                this.getHeaderTable().find(".e-filterbar").remove();
                            else if (this.model.filterSettings.filterType == ej.Grid.FilterType.Menu || this.model.filterSettings.filterType == ej.Grid.FilterType.Excel)
                                this.getHeaderTable().find(".e-columnheader").find(".e-filtericon").remove()
                                    .end().find(".e-headercellfilter").removeClass("e-headercellfilter");
                            if (this._isExcelFilter) {
                                this._isExcelFilter = false;
                                this._excelFilter.resetExcelFilter();
                                this._excelFilter = null;
                            }
                            this.model.filterSettings.filteredColumns = [];
                            this.refreshContent();
                        } else {
                            if (this.model.filterSettings.filterType == ej.Grid.FilterType.FilterBar) {
                                this.getHeaderTable().find(".e-filterbar").remove();
                                this.getHeaderTable().find(".e-columnheader").find(".e-filtericon").remove()
                                    .end().find(".e-headercellfilter").removeClass("e-headercellfilter");
                                this._renderFiltering();
                                if (this.model.filterSettings.showFilterBarStatus && !this.model.allowPaging)
                                    this._createPagerStatusBar();
                                else if (this.model.allowPaging)
                                    this.getPager().ejPager({ enableExternalMessage: this.model.filterSettings.showFilterBarStatus });
                                var $filterbar = this.getHeaderTable().find(".e-filterbar");
                                for (var i = 0; i < this.model.groupSettings.groupedColumns.length; i++)
                                    $filterbar.prepend(this._getEmptyFilterBarCell());
                            } else if (!_filter && (this.model.filterSettings.filterType == ej.Grid.FilterType.Menu || this.model.filterSettings.filterType == ej.Grid.FilterType.Excel)) {
                                var _filter = 1;
                                this.getHeaderTable().find(".e-columnheader").find(".e-filtericon").remove()
                                    .end().find(".e-headercellfilter").removeClass("e-headercellfilter");
                                this.getHeaderTable().find(".e-filterbar").remove();
                                var columnHeader = this.getHeaderTable().find(".e-columnheader").find(".e-headercell").not(".e-detailheadercell");
                                for (var i = 0; i < columnHeader.length; i++) {
                                    var columnName = columnHeader.eq(i).find(".e-headercelldiv").attr("ej-mappingname");
									if(!ej.isNullOrUndefined(columnName)){
										var column = this.getColumnByField(columnName);
										if (!ej.isNullOrUndefined(column) && (ej.isNullOrUndefined(column.allowFiltering) || column.allowFiltering))
											columnHeader.eq(i).addClass("e-headercellfilter").append(ej.buildTag('div.e-filtericon e-icon e-filterset'));
									}
								}                               
							   if (this.model.filterSettings.filterType == ej.Grid.FilterType.Excel) {
                                    this._isExcelFilter = true;
                                    this._renderExcelFilter();
                                } else if (this._isExcelFilter) {
                                    this._isExcelFilter = false;
                                    this._excelFilter.resetExcelFilter();
                                    this._excelFilter = null;
                                }
                                this._renderFilterDialogs();
                                this.model.filterSettings.filteredColumns = [];
                                this.refreshContent();
                            }
                            this._enableFilterEvents();
                        }
                        break;
                    case "enableRowHover":
                        this.model.enableRowHover = options[prop];
                        this._enableRowHover();
                        break;
                    case "allowScrolling":
                    case "scrollSettings":
                        var $content = this.getContent();
                        if (prop != "allowScrolling") {
                            if (!ej.util.isNullOrUndefined(options["scrollSettings"])) {
                                if ($.isEmptyObject(options["scrollSettings"])) break;
                                $.extend(this.model.scrollSettings, options["scrollSettings"]);
                            }
							if(this.model.scrollSettings.allowVirtualScrolling){
								this._currentPage(1);
								this.model.currentIndex = 1;
								if(this.model.scrollSettings.enableVirtualization){								
									this._virtualRowCount = Math.round(this.model.scrollSettings.height / this.getRowHeight()) + 1; 
									this._refreshVirtualViewDetails();
									this._refreshVirtualViewData();
								}
								else {
									this._createPagerStatusBar();
									this._showPagerInformation(this.model.pageSettings);
								}
							}
                            if (options["scrollSettings"]["frozenColumns"] !== undefined || options["scrollSettings"]["frozenRows"] !== undefined ||
                                options["scrollSettings"]["allowVirtualScrolling"] !== undefined || options["scrollSettings"]["virtualScrollMode"] !== undefined ||
								options["scrollSettings"]["enableVirtualization"] != undefined) {
                                var model = this.model;
                                model.query = this.commonQuery.clone();
                                if (this._selectedRow() != -1)
                                    this.clearSelection(this._selectedRow());
                                if (options["scrollSettings"]["virtualScrollMode"] != undefined)
                                    model.pageSettings.currentPage = 1;
                                this.element.ejGrid("destroy").ejGrid(model);
                            }
                            else {
                                if (!ej.util.isNullOrUndefined(options["allowScrolling"]))
                                    this.model.allowScrolling = options["allowScrolling"];
                                !ej.util.isNullOrUndefined($content.data("ejScroller")) && $content.ejScroller("destroy");
                                if (this.model.allowScrolling) {
                                    this.setWidthToColumns();
                                    this.getHeaderContent().find("div").first().addClass("e-headercontent");
									 this._originalScrollWidth = this.model.scrollSettings.width;
                                    this._renderScroller();
                                } else {
                                    this.element.children(".e-gridheader").removeClass("e-scrollcss");
                                    this.element.get(0).style.width.length == 0 && this.element.css("width", "auto");
                                    this.setWidthToColumns();
                                }                              
                            }
                        }
                        break;
					case "currentIndex":
						if(this.model.allowScrolling &&  this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){
							var currentView = Math.ceil(options["currentIndex"] / this._virtualRowCount);
							this._isThumbScroll = true;
							this._refreshVirtualView(currentView);
							this._refreshVirtualViewScroller(true);
						}
						else
							this._scrollObject.option("scrollTop", options["currentIndex"] * this.getRowHeight());						
						break;
                    case "locale":
                        this.model.locale = options[prop];
                        var model = this.model;
                        model.query = this.commonQuery.clone();
                        this.element.ejGrid("destroy").ejGrid(model);
                        break;
                    case "dataSource":
                        var $content = this.element.find(".e-gridcontent").first();
                        if (!$.isFunction(options["dataSource"]))
                            this.resetModelCollections();
						if(this._gridRecordsCount == 1 && !ej.isNullOrUndefined(this._cDeleteData) && $.inArray(this._cDeleteData[0], this._dataSource()) == -1 && this.model.editSettings.allowDeleting)
                            this._gridRecordsCount =this._dataSource().length;
						this._refreshDataSource(this._dataSource());
						this.element.children(".e-gridfooter").remove();
						if (this.model.showSummary && this.model.currentViewData.length > 0) {
						    this._renderGridFooter().insertAfter($content);
						}
                        if (this._gridRecordsCount && this.model.allowFiltering) {
                            this._initColumns(this.model.currentViewData[0] != undefined ? this.model.currentViewData[0] : this.model.currentViewData.value);
                            this._renderFilterDialogs();
                        }
						if(!this.model.scrollSettings.enableVirtualization || this._gridRows.length < this._virtualRowCount)
							this._addLastRow();
                        break;
                    case "selectedRowIndex":
                        if (this._selectedRow() != -1 && $.inArray(this._selectedRow(), this.selectedRowsIndexes) == -1){
							this.model.currentIndex = this._selectedRow();
                            this.selectRows(this._selectedRow());
						}
                        else if (this._selectedRow() == -1) {
                            this.clearSelection();
                            this.selectedRowsIndexes = [];
                        }
                        break;
                    case "editType":
                        if (this._selectedRow() != -1 && $.inArray(this._selectedRow(), this.selectedRowsIndexes) == -1)
                            this.selectRows(this._selectedRow());
                        break;
                    case "editSettings":
                        $.extend(this.model.editSettings, options[prop]);
                        this.refreshToolbar();
						this._processEditing();
                        this.refreshBatchEditMode();
                        this._tdsOffsetWidth = [];
                        $("#" + this._id + "_dialogEdit").data("ejDialog") && $("#" + this._id + "_dialogEdit").ejDialog("destroy");
                        $("#" + this._id + "_dialogEdit_wrapper,#" + this._id + "_dialogEdit").remove();
                        $("#" + this._id + "_externalEdit").remove();
                        if (this.model.editSettings.editMode != 'normal')
                            this.model.editSettings.showAddNewRow = false;
                        if (!this.model.editSettings.showAddNewRow) 
                            this.getContentTable().find(".e-addedrow").length && this.cancelEdit();
                        if (this.model.editSettings.allowEditing || this.model.editSettings.allowAdding) {
                            if (this.model.editSettings.editMode == "dialog" || this.model.editSettings.editMode == "dialogtemplate")
                                this.element.append(this._renderDialog());
                            else if (this.model.editSettings.editMode == "externalform" || this.model.editSettings.editMode == "externalformtemplate")
                                this.element.append(this._renderExternalForm());
                       }
                        if (this.model.editSettings.allowDeleting && this.model.editSettings.showDeleteConfirmDialog)
                            ej.isNullOrUndefined(this._confirmDialog) && this._renderConfirmDialog();
                        this._enableEditingEvents();
						this.refreshToolbar();
                        break;
                    case "allowResizing":
                        this.model.allowResizing = options[prop];
                        if (this.model.allowResizing) {
                            this._on(this.element, ej.eventType.mouseMove, this._mouseMove);
                            this._on(this.element, "mouseup", this._mouseUp);
                            this._resizer = this._resizer || new ej.gridFeatures.gridResize(this);
                        }
                        else {
                            this._off(this.element, ej.eventType.mouseMove, this._mouseMove);
                            this._off(this.element, "mouseup", this._mouseUp);
                            if (!this.model.allowResizeToFit)
                                this._resizer = null;
                        }
                        break;
                    case "allowResizeToFit":
                        if (this.model.allowResizeToFit) {
                            this._on(this.element, "dblclick", ".e-gridheader", this._headerdblClickHandler);
                            this._resizer = this._resizer || new ej.gridFeatures.gridResize(this);
                            this.setWidthToColumns();
                        }
                        else {
                            this._off(this.element, "dblclick", ".e-gridheader", this._headerdblClickHandler);
                            if (!this.model.allowResizing)
                                this._resizer = null;
                        }
                        break;
                    case "allowReordering":
                        this.model.allowReordering = options[prop];
                        if (this.model.allowReordering)
                            this._headerCellreorderDragDrop();
                        break;
                    case "showSummary":
                    case "summaryRows":
                        if (prop == "showSummary" && options[prop]) this.addSummaryTemplate();
                        if (prop == "showSummary" && !options[prop])
                            this.element.children(".e-gridfooter").remove();
                        else if (prop == "summaryRows" && this.model.showSummary || prop == "showSummary") {
                            this.element.children(".e-gridfooter").remove();
                            this.element.children(".e-gridfooter").remove();
                            var $content = this.element.find(".e-gridcontent").first();
                            var query = this.model.query.queries;
                            var pageQuery = [];
                            for (var i = 0; i < query.length; i++) {
                                if (query[i].fn === "onPage") {
                                    pageQuery = query.splice(i, 1);
                                }
                            }
                            var queryManager = this.model.query;
                            this._setSummaryAggregate(queryManager);
                            queryManager.queries.push(pageQuery[0]);
                            if (this.model.currentViewData.length) {
                                if (this._isLocalData) {
                                    this._remoteSummaryData = this._dataManager.executeLocal(queryManager).aggregates;
                                    this._renderGridFooter().insertAfter($content);
                                }
                                else {
                                    var proxy = this;
                                    var promise = this._dataManager.executeQuery(queryManager);
                                    promise.done(function (e) {
                                        proxy.element.children(".e-gridfooter").remove();
                                        proxy._remoteSummaryData = e.aggregates
                                        proxy._renderGridFooter().insertAfter($content);
                                    });
                                }
                            }
                            if (this.model.allowGrouping) {
                                this._rowCol = this._captionSummary();
                                this._isCaptionSummary = (this._rowCol != null && this._rowCol.length) > 0 ? true : false;
                                this.refreshContent(true);
                            }
                        }
                        break;
                    case "enableAltRow":
                        this.model.enableAltRow = options[prop];
                        this.addInitTemplate();
                        this.refreshContent();
                        break;
                    case "toolbarSettings":
                        $.extend(this.model.toolbarSettings, options[prop]);
                        this.element.children(".e-gridtoolbar").remove();
                        if (this.model.toolbarSettings.showToolbar)
                            this._renderToolBar().insertBefore(this.element.find(".e-gridheader").first());
                        break;
                    case "allowSorting":
                        this.model.allowSorting = options[prop];
                        if (!this.model.allowSorting) 
                            this.clearSorting();
                        break;
                    case "selectionSettings":
                        $.extend(this.model.selectionSettings, options[prop]);
                        this.clearSelection();
                        this.clearCellSelection();
                        this.clearColumnSelection();
                        this._allowrowSelection = this._allowcellSelection = this._allowcolumnSelection = false;
						if(this.model.selectionSettings.selectionMode.length > 0 && this.model.allowSelection)
							this._initSelection();
                        break;
                    case "sortSettings":
                        $.extend(this.model.sortSettings, options[prop]);
                        this.refreshContent();
                        break;
                    case "contextMenuSettings":
                        $.extend(this.model.contextMenuSettings, options[prop]);
                        !ej.isNullOrUndefined($("#" + this._id + "_Context").data("ejMenu")) && $("#" + this._id + "_Context").ejMenu("destroy") && $("#" + this._id + "_Context").remove();
                        if (this.model.contextMenuSettings.enableContextMenu)
                            this._renderContext()
                        break;
                    case "enableRTL":
                        this.model.enableRTL = options[prop];
                        var model = this.model;
                        model.query = this.commonQuery.clone();
                        this.element.ejGrid("destroy");
                        model.enableRTL ? $("#" + this._id).addClass("e-rtl") : $("#" + this._id).removeClass("e-rtl");
                        $("#" + this._id).ejGrid(model);
                        break;
                    case "enableTouch":
                        this.model.enableTouch = options[prop];
                        if (!this.model.enableTouch) {
                            this.element.addClass("e-touch");
                            this._off(this.element, "swipeleft swiperight", ".e-gridcontent .e-table");
                        }
                        else {
                            this._on(this.element, "swipeleft swiperight", ".e-gridcontent .e-table", $.proxy(this._touchGrid, this));
                            this.element.removeClass("e-touch");
                        }
                        break;
                    case "allowSelection":
                        if (options[prop]) {
                            this._off(this.element, ($.isFunction($.fn.tap) && this.model.enableTouch) ? "tap" : "click", this._clickHandler);
                            this._on(this.element, "click", this._clickHandler);
							this._initSelection();
                        }
                        else {
                            this.clearSelection();
                            this.clearCellSelection();
                            this.clearColumnSelection();
                            this._allowrowSelection = this._allowcellSelection = this._allowcolumnSelection = false;
                        }
                        break;
                    case "query":
                        this.commonQuery = $.extend(true, {}, options[prop]);
                        break;
                    case "showStackedHeader":
                    case "stackedHeaderRows":
                        if (this.model.showStackedHeader && options["stackedHeaderRows"] && options.stackedHeaderRows.length > 0) {
                            if (ej.getObject("stackedHeaderRows.length", options))
                                this.model.stackedHeaderRows = options["stackedHeaderRows"];                            
                            this._refreshStackedHeader();
                         }
                          else
                            this.getHeaderTable().find(".e-stackedHeaderRow").remove();
                        break;
                    case "allowTextWrap":
                    case "textWrapSettings":
                        $.extend(this.model.textWrapSettings, options[prop]);
                            this._setTextWrap();
                        break;
                    case "rowTemplate":
                        this.refreshContent(true);
                        break;
                    case "detailsTemplate":
                        if (this.model.scrollSettings.frozenColumns > 0 || this.model.scrollSettings.frozenRows > 0) {
                            this._renderAlertDialog();
                            this._alertDialog.find(".e-content").text(this._getLocalizedLabels("FrozenNotSupportedException"));
                            this._alertDialog.ejDialog("open");
                        }
                        else {
                            var $header = this.element.children(".e-gridheader");
                            $header.find("div").first().empty().append(this._renderGridHeader().find("table"));
                            if (this.model.allowFiltering && this.model.filterSettings.filterType == "filterbar")
                                this._renderFiltering();
                            this.setGridHeaderContent($header);
                            this.refreshContent(true);
                            if (this.model.allowReordering)
                                this._headerCellreorderDragDrop();
                            if (this.model.allowGrouping)
                                this._headerCellgDragDrop();
                        }
                        break;
                }
            }

        },
        
        resetModelCollections: function () {
            this.model.groupSettings.groupedColumns = [];
            this.model.filterSettings.filteredColumns = [];
            this.model.sortSettings.sortedColumns = [];
            this.model.pageSettings.currentPage = this.defaults.pageSettings.currentPage;
        },
        _enableGrouping: function(){
			this.refreshTemplate();
			if (this.model.groupSettings.showToggleButton) {
			    for (var columnCount = 0; columnCount < this.model.columns.length; columnCount++) {
			        var headercell = this.getHeaderTable().find(".e-columnheader").find(".e-headercelldiv").eq(columnCount);
 					var field = this.model.columns[columnCount].field;
			        if ($.inArray(field, this._disabledGroupableColumns) == -1 && !ej.isNullOrUndefined(field) && field != "") {
			            if (!headercell.find(".e-gridgroupbutton").length) {
			                if ($.inArray(field, this.model.groupSettings.groupedColumns) != -1)
			                    headercell.append(this._getToggleButton().addClass("e-toggleungroup"));
			                else
			                    headercell.append(this._getToggleButton().addClass("e-togglegroup"));
			            }
			        }
			    }
			}
			if (!this.model.groupSettings.showToggleButton)
			    this.getHeaderTable().find(".e-gridgroupbutton").remove();
			this.element.find(".e-groupdroparea").remove();
			if (this.model.groupSettings.showDropArea) {
			    this.model.showColumnChooser && this.element.find(".e-ccButton").length > 0 ? this.element.find(".e-ccButton").after(this._renderGroupDropArea()) : this.element.prepend(this._renderGroupDropArea());
			    if (ej.gridFeatures.dragAndDrop) {
			        this._groupHeaderCelldrag();
			        this._headerCellgDragDrop();
			    }
			}
			if (!ej.isNullOrUndefined(this.model.groupSettings.groupedColumns.length) && this.model.groupSettings.groupedColumns.length) {
				var args = {};
			    args.columnName = this.model.groupSettings.groupedColumns[this.model.groupSettings.groupedColumns.length - 1];
			    args.requestType = ej.Grid.Actions.Grouping;
			    $(".e-grid").find(".e-groupdroparea").empty();
				for (var i = 0; i < this.model.groupSettings.groupedColumns.length - 1; i++)
					this._addColumnToGroupDrop(this.model.groupSettings.groupedColumns[i]);
				for (var i = 0; i < this.model.groupSettings.groupedColumns.length; i++) {
					if (ej.isNullOrUndefined(this.getsortColumnByField(this.model.groupSettings.groupedColumns[i])))
						this.model.sortSettings.sortedColumns.push({ field: this.model.groupSettings.groupedColumns[i], direction: ej.sortOrder.Ascending});
				}
				this._processBindings(args);
			}
        },
        
        addIgnoreOnExport: function (args) {
            if (typeof (args) == 'string')
                this.ignoreOnExport.push(args);
            else
                this.ignoreOnExport = this.ignoreOnExport.concat(args);
        },
        _decode: function (value) {
            return $('<div/>').html(value).text();
        },
        _htmlEscape: function (str) {
            var regx = /[&<>"']/g, charEntities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&#34;",
                "'": "&#39;"
            };
            return str.replace(regx, function (c) {
                return charEntities[c];
            });
        },
        _getForeignKeyData: function (data) {
            var proxy = this;
            var column = {};
            for (i = 0; i < this.model.columns.length; i++) {
                if (this.model.columns[i].foreignKeyValue && this.model.columns[i].dataSource) {
                    var fieldName = ej.isNullOrUndefined(proxy.model.columns[i]["foreignKeyField"]) ? proxy.model.columns[i]["field"] : proxy.model.columns[i]["foreignKeyField"];
                    var dataSource = this.model.columns[i].dataSource instanceof ej.DataManager ? this.model.columns[i].foreignKeyData : this.model.columns[i].dataSource;
                    dataSource.filter(function (col) {
                        var value = data[proxy.model.columns[i]["field"]];
                        var fValue = !isNaN(parseFloat(value)) && isFinite(value) ? parseFloat(value) : value;
                        if (col[fieldName] == fValue) {
                            column[fieldName] = col;
                        }
                    });
                }
            }
            return column;
        },
        _foreignKeyBinding: function (curColumn, cellValue, gridId) {
            var cellData, val;
            var gridObj = $("#" + gridId).ejGrid('instance');
            curColumn = gridObj.model.columns[curColumn];
            var dataSource = curColumn.dataSource instanceof ej.DataManager ? curColumn.foreignKeyData : curColumn.dataSource;
            dataSource.filter(function (col) {
                if (ej.getObject(curColumn.foreignKeyField, col) == cellValue) {
                    val = ej.getObject(curColumn.foreignKeyValue, col);
                    return cellData = curColumn.type == "date" ? new Date(val) : val;
                }
            });
            if (curColumn.format) {
                cellData = gridObj.formatting(curColumn.format, cellData, gridObj.model.locale);
            }
            return cellData;
        },
        _checkForeignKeyBinding: function () {
            if (!this.model.columns.length)
                return;
            var c, _cols, _len, _col;
            for (c = 0, _cols = this.model.columns, _len = _cols.length; c < _len; c++) {
                _col = _cols[c];
                if (_col.hasOwnProperty("foreignKeyField") && _col["dataSource"] instanceof ej.DataManager)
                    this._relationalColumns.push({ field: _col["field"], key: _col["foreignKeyField"], value: _col["foreignKeyValue"], dataSource: _col["dataSource"] });
            }
            this._$fkColumn = true;
        },  
        _setForeignKeyData: function (args) {
            if (!this._relationalColumns.length)
                return;
            var arr = this._relationalColumns, len = this._relationalColumns.length,
                promises = [], viewData = this.model.currentViewData, e = {};
            var obj, qry, pred, dist, qPromise, proxy = this;
         
            var failFn = ej.proxy(function (e) { /*Separate fail handler to get more control over request*/
                this._trigger("actionFailure", { requestType: "fetchingforeigndata", error: e.error });
            }, this);
            if (!this.element.ejWaitingPopup("model.showOnInit"))
                this.element.ejWaitingPopup("show");
                
            for (var i = 0; i < len; i++) {
                if (!(0 in viewData)) continue;
                obj = arr[i], e.field = obj["field"], e.keyField = obj["key"], e.valueField = obj["value"], e.dataSource = obj["dataSource"],
                            e.query = new ej.Query().select([e.valueField, e.keyField]).foreignKey(e.keyField),
                            dist = ej.distinct(viewData.level ? viewData.records : viewData, e.keyField, true);
                       
                pred = ej.UrlAdaptor.prototype.getFiltersFrom(dist, e.query);
                e.query.where(pred);
                        
                if (this._trigger("actionBegin", $.extend(e, { requestType: "fetchingforeigndata", column: this.getColumnByField(e.field) })))
                    return;
                qPromise = e.dataSource.ready === undefined ? e.dataSource.executeQuery(e.query, null, failFn) : e.dataSource.ready.fail(failFn);
                promises.push(qPromise);
            }
                
            $.when.apply(this, promises).then(function () {
                proxy.element.ejWaitingPopup("hide");
                var arg = [].slice.call(arguments, 0, arguments.length), column;
                for (var i = 0, plen = promises.length; i < plen; i++) {
                    obj = arr[i];
                    for (var c = 0, clen = proxy.model.columns.length; c < clen; c++) {
                        column = proxy.model.columns[c];
                        if (column["foreignKeyField"] == obj["key"] && column["foreignKeyValue"] == obj["value"])
                            column["foreignKeyData"] = arg[i].result;
                    }
                }
                proxy.initialRender ? proxy._initGridRender() : proxy.sendDataRenderingRequest(args);
            });
                
        },
        _isRelationalRendering: function (args) {
            return (0 in this._relationalColumns) && ["add", "beginedit", "cancel"].indexOf(args.requestType) == -1;
        }        
    };
})(jQuery, Syncfusion);;
(function ($, ej, undefined) {
    ej.gridFeatures = ej.gridFeatures || {};
    ej.gridFeatures.edit = {
        _processEditing: function () {
            var colInfo = this._columnToSelect(), query = colInfo.query, dropField = colInfo.fields, promises = [], qPromise,
                            e = this._relationalColumns, len = e.length, req;
            this.model.query._fromTable != "" && query.from(this.model.query._fromTable);
            req = dropField.length;
            if (req)
                promises.push(this._dataManager.executeQuery(query));
            if (len != 0) {
                for (var i = 0; i < len; i++) {
                    obj = e[i], qry = new ej.Query().select([obj.key, obj.value]);
                    qPromise = obj["dataSource"].ready === undefined ? obj["dataSource"].executeQuery(qry) : obj["dataSource"].ready;
                    promises.push(qPromise);
                }
            }
            if (promises.length != 0) {
                $.when.apply(this, promises).then(ej.proxy(function () {
                    var arg = [].slice.call(arguments, 0, arguments.length);
                    for (var i = 0, j = 0, s = req, flag, plen = promises.length; i < plen; i++) {
                        while (s > 0) {
                            ej.createObject(dropField[--s], arg[i].result, this._dropDownManager);
                            flag = true;
                        }
                        if (flag && i == 0) continue; /* i == 0 - since one req will be made for all Ddl columns*/
                        obj = e[j], key = obj.key + "." + obj.value;
                        ej.createObject(key, arg[i].result, this._dropDownManager);
                        j++;
                    }
                    this._initiateTemplateRendering();
                }, this));
            }
            else
                this._initiateTemplateRendering();
        },
        _initiateTemplateRendering: function() {
            if (this.model.editSettings.editMode == "normal") this.addEditingTemplate();
            else if (this.model.editSettings.editMode == "batch") this.addBatchEditTemplate();
            else if (this.model.editSettings.editMode == "dialog" ||
                this.model.editSettings.editMode == "externalform" ||
               this.model.editSettings.editMode == "inlineform")
                this.addDialogEditingTemplate();
            else this.addExternalDialogEditingTemplate();
            if ((this.model.editSettings.showAddNewRow && this.model.editSettings.editMode == "normal"))
                this._startAdd();
        },
        addEditingTemplate: function () {
            if (this.model.columns.length == 0)
                return;
            var $tbody = ej.buildTag('tbody');
            var $tr = ej.buildTag('tr');
            var $td = ej.buildTag('td', "", {}, { colSpan: this.model.scrollSettings.frozenColumns > 0 ? this.model.scrollSettings.frozenColumns : this.model.columns.length });
            var $form = ej.buildTag('form', "", {}, { id: this._id + "EditForm", "class": "gridform" });
            var $table = ej.buildTag('table.e-table', "", {}, { cellspacing: 0.25 });
            var $innerTbody = ej.buildTag('tbody');
            var $innerTr = ej.buildTag('tr');
            $tbody.append($tr);
            $tr.append($td);
            $td.append($form);
            var $colGroup = $(document.createElement('colgroup'));
            $form.append($table);
            $table.append($colGroup);
            $innerTbody.append($innerTr).appendTo($table);
            if (this.model.scrollSettings.frozenColumns > 0) {
                var $tbodyClone = $tbody.clone();
                $tbodyClone.find("td").first().prop("colSpan", this.model.columns.length - this.model.scrollSettings.frozenColumns);
            }
            for (var columnCount = 0; columnCount < this.model.columns.length; columnCount++) {
                var $innerTd = ej.buildTag('td.e-rowcell');
                $innerTr.append($innerTd.get(0));
                if (ej.isNullOrUndefined(this.model.columns[columnCount]["commands"]) &&
                 (!this.model.columns[columnCount]["template"] || (this.model.columns[columnCount]["template"] && this.model.columns[columnCount]["allowEditing"] != false && this.model.columns[columnCount]["field"]))) {
                    this._initCellEditType(columnCount, $innerTd);
                } else if (this.model.columns[columnCount]["template"]) {
                    var helpers = {}, htxt = this.model.columns[columnCount].headerText;
                    helpers["_" + this._id + "ColumnTemplating"] = ej.proxy(this._gridTemplate, null, this);
                    $.views.helpers(helpers);
                    if (!ej.isNullOrUndefined(htxt) && !ej.isNullOrUndefined(htxt.match(/[^0-9\s\w]/g)))
                        htxt = htxt.replace(/[^0-9\s\w]/g, "_");
                    $("#" + this._id + htxt + columnCount + "_Template").remove();
                    var scriptElement = this._createTemplateElement(this.model.columns[columnCount]);
                    $innerTd.addClass("e-templatecell").html("{{:~_" + this._id + "ColumnTemplating('" + scriptElement.id + "')}}");
                } else if (this.model.columns[columnCount]["commands"]) {
                    var helpers = {};
                    helpers["_" + this._id + "UnboundTemplate"] = this._unboundTemplateRendering;
                    $.views.helpers(helpers);
                    $("#" + this._id + this.model.columns[columnCount].headerText.replace(/[^a-z0-9|s_]/gi, '')+ "_UnboundTemplate").remove();
                    divElement = this._createUnboundElement(this.model.columns[columnCount]);
                    $innerTd.addClass("e-unboundcell").addClass("e-" + this.model.columns[columnCount]["headerText"].replace(/[^a-z0-9|s_]/gi, '') + columnCount).html("{{:~_" + this._id + "UnboundTemplate('" + divElement.id + "')}}");
                    this.model.scrollSettings.frozenColumns > 0 && $innerTd.addClass("e-frozenunbound");
                    this._isUnboundColumn = true;
                }
                if (this.model.columns[columnCount]["textAlign"] != undefined)
                    $innerTd.css("text-align", this.model.columns[columnCount]["textAlign"]);
                this.model.columns[columnCount]["allowEditing"] == false && $innerTd.find(".e-field").attr("disabled", true).addClass("e-disable");
                if (this.model.columns[columnCount]["isPrimaryKey"] === true)
                    $innerTd.find(".e-field").attr("disabled", true).addClass("e-disable");
                if (this.model.columns[columnCount]["isIdentity"] === true) {
                    $innerTd.find(".e-field").addClass("e-identity");
                    this._identityKeys.push($.trim(this.model.columns[columnCount].field));
                    this._identityKeys = $.unique(this._identityKeys);
                }
                var $col = $(document.createElement('col'));
                if (this.model.columns[columnCount]["priority"]) {
                    $innerTd.addClass("e-table-priority-" + this.model.columns[columnCount]["priority"]);
                    $col.addClass("e-table-priority-" + this.model.columns[columnCount]["priority"]);
                }
                if (this.model.columns[columnCount]["visible"] === false) {
                    $col.css("display", "none");
                    $innerTd.addClass("e-hide");
                }
                if (!ej.isNullOrUndefined(this.model.columns[columnCount]["cssClass"])) {
                    $innerTd.addClass(this.model.columns[columnCount]["cssClass"]);
                }
                !this.model.groupSettings.showGroupedColumn && $innerTd.addClass("{{for ~groupedColumns}}" +
                    " {{if #data == '" + this.model.columns[columnCount]["field"] + "'}}e-hide{{/if}}" +
                    "{{/for}}") && $col.css("display", "none");
                $colGroup.append($col);
                if (columnCount == this.model.scrollSettings.frozenColumns - 1) {
                    $innerTr = $tbodyClone.find("tr").last();
                    $colGroup = $tbodyClone.find("colgroup");
                    $.templates(this._id + "_JSONFrozenEditingTemplate", $tbody.html());
                    $tbody = $tbodyClone;
                }
            }
            $.templates(this._id + "_JSONEditingTemplate", $tbody.html());
        },

        addDialogEditingTemplate: function () {
            if (this.model.columns.length == 0)
                return;
            var $tbody = ej.buildTag('div');
            var $form = ej.buildTag('form.gridform', "", {}, { id: this._id + "EditForm" });
            var $table = ej.buildTag('table', "", {}, { cellspacing: "14px" });
            var $innerTr, $labelTd, $valueTd, trElement, tdElement;
            for (var columnCount = 0; columnCount < this.model.columns.length; columnCount++) {
                if (this.model.editSettings.editMode == "dialog") {
                    trElement = 'tr';
                    tdElement = 'td';
                }
                else trElement = tdElement = 'div';
                $innerTr = ej.buildTag(trElement);
                $labelTd = ej.buildTag(tdElement, "", { "text-align": "right" }).addClass("e-label");
                $valueTd = ej.buildTag(tdElement, "", { "text-align": "left" }).addClass("e-rowcell");
                 if (this.model.columns[columnCount]["priority"] && this.model.editSettings.editMode == "inlineform") 
                    $innerTr.addClass("e-table-priority-" + this.model.columns[columnCount]["priority"]);
                $innerTr.append($labelTd.get(0)).append($valueTd.get(0));
                if (this.model.columns[columnCount].headerText == undefined)
                    this.model.columns[columnCount].headerText = this.model.columns[columnCount].field;
                $labelTd.append("<label for='" + this.model.columns[columnCount].field + "'>" + this.model.columns[columnCount].headerText + "</label>");
                if (ej.isNullOrUndefined(this.model.columns[columnCount]["commands"]) &&
				(!this.model.columns[columnCount]["template"] || (this.model.columns[columnCount]["template"] && this.model.columns[columnCount]["allowEditing"] !=false && this.model.columns[columnCount]["field"])))
                    this._initCellEditType(columnCount, $valueTd);
                else if (this.model.columns[columnCount]["template"]) {
                    var helpers = {}, htxt = this.model.columns[columnCount].headerText;
                    helpers["_" + this._id + "ColumnTemplating"] = ej.proxy(this._gridTemplate, null, this);
                    $.views.helpers(helpers);
                    if (!ej.isNullOrUndefined(htxt) && !ej.isNullOrUndefined(htxt.match(/[^0-9\s\w]/g)))
                        htxt = htxt.replace(/[^0-9\s\w]/g, "_");
                    $("#" + this._id + htxt + columnCount + "_Template").remove();
                    var scriptElement = this._createTemplateElement(this.model.columns[columnCount]);
                    $valueTd.addClass("e-templatecell").html("{{:~_" + this._id + "ColumnTemplating('" + scriptElement.id + "')}}");
                } else if (this.model.columns[columnCount]["commands"]) {
                    var helpers = {};
                    helpers["_" + this._id + "UnboundTemplate"] = this._unboundTemplateRendering;
                    $.views.helpers(helpers);
                    $("#" + this._id + this.model.columns[columnCount].headerText.replace(/[^a-z0-9|s_]/gi, '')+ "_UnboundTemplate").remove();
                    divElement = this._createUnboundElement(this.model.columns[columnCount]);
                    $valueTd.addClass("e-unboundcell").addClass("e-" + this.model.columns[columnCount]["headerText"].replace(/[^a-z0-9|s_]/gi, '')+columnCount).html("{{:~_" + this._id + "UnboundTemplate('" + divElement.id + "')}}");
                    this.model.scrollSettings.frozenColumns > 0 && $valueTd.addClass("e-frozenunbound");
                    this._isUnboundColumn = true;
                    $innerTr.addClass("e-hide");
                }
                this.model.columns[columnCount]["allowEditing"] == false && $valueTd.find(".e-field").attr("disabled", true).addClass("e-disable");
                if (this.model.columns[columnCount]["isIdentity"] === true) {
                    $valueTd.find(".e-field").addClass("e-identity");
                    this._identityKeys.push($.trim(this.model.columns[columnCount].field));
                    this._identityKeys = $.unique(this._identityKeys);
                }
                if (this.model.columns[columnCount]["visible"] === false)
                    $innerTr.addClass("e-hide");
                 if (!ej.isNullOrUndefined(this.model.columns[columnCount]["cssClass"])) {
                     $valueTd.addClass(this.model.columns[columnCount]["cssClass"]);
                }
                if (this.model.editSettings.editMode == "dialog") {
                    $form.append($table);
                    $table.append($innerTr);
                } else
                    $form.append($innerTr);
                $form.appendTo($tbody);
                if (this.model.columns[columnCount]["isPrimaryKey"] === true) {
                    $valueTd.find(".e-field").attr("disabled", true).addClass("e-disable");
                    this._primaryKeys.push($.trim(this.model.columns[columnCount].field));
                    this._primaryKeys = $.unique(this._primaryKeys);
                }
            }
            if (this.model.editSettings.editMode == "dialog") $form.append($table);
            $tbody = this.renderDiaglogButton($form, $tbody);
            $.templates(this._id + "_JSONDialogEditingTemplate", $tbody.html());
        },
        _editEventTrigger: function (args) {
            if (args.requestType == "save" || args.requestType == "delete") {
                var params = {
                    data: args.data,
                    previousData: args.previousData,
                    action: args.action !== undefined ? args.action : args.requestType,
                };
                if (!ej.isNullOrUndefined(args.foreignKeyData))
                    params.foreignKeyData = args.foreignKeyData;
				this._trigger("end" + params.action.charAt(0).toUpperCase() + params.action.slice(1), params);
            }
        },
        _compiledDropDownTemplate: function (valueField, textField, colType, format) {
            var helpers = { _gridFormatting: this.formatting };
            $.views.helpers(helpers);
            var $select = ej.buildTag('select');
            var $option = ej.buildTag("option", format != null ? "{{:~_gridFormatting('" + format + "'," + textField + ",'" + this.model.locale + "')}}" : "{{:" + textField + "}}", {}, { value: "{{:" + valueField + "}}" });
            $select.append($option);
            return $.templates($select.html());
        },
        _initCellEditType: function (columnCount, element) {
            var fName = this.model.columns[columnCount].field;
            if (this.model.columns[columnCount]["foreignKeyValue"])
                this.model.columns[columnCount]["editType"] = "dropdownedit";
            if (this._dataSource() instanceof ej.DataManager  && this._dataSource().adaptor instanceof ej.ForeignKeyAdaptor) {
                var index = $.inArray(this.model.columns[columnCount].field,this._dataSource().adaptor.value),fk_Value,fk_fieldName;
				 if(index != -1){
						fk_Value = this._dataSource().adaptor.value[index];
						fk_fieldName = this._dataSource().adaptor.key[index];	 
				 }
            }
            if (this.model.columns[columnCount]["editTemplate"])
                this.model.columns[columnCount]["editType"] = "edittemplate";
            if (ej.isNullOrUndefined(this.model.columns[columnCount]["editType"]))
                if (this.model.columns[columnCount]["type"] == "date" || this.model.columns[columnCount]["type"] == "datetime")
                    this.model.columns[columnCount]["editType"] = this.model.columns[columnCount]["type"] + "picker";
                else
                    this.model.columns[columnCount]["editType"] = "stringedit";
            if (this.model.isResponsive)
                element.attr("data-cell",this._decode(this.model.columns[columnCount]["headerText"]));
            var splits = (fName || "").split("."), sLen = splits.length - 1, braces = "";
            if (!ej.isNullOrUndefined(fName))
                fName = fName.replace(/[^a-z0-9\s_]/gi, '');
            while (sLen) {
                braces += "(";
                sLen--;
            }
            switch (this.model.columns[columnCount]["editType"]) {
                case "edittemplate":
                    var temp = this.model.columns[columnCount].editTemplate.create;
                    if (typeof temp == "string") {
                        var temp1 = ej.util.getObject(temp, window);
                        if (!$.isFunction(temp1)) {
                            if ($(temp).length == 1 && $(temp).get(0).tagName == "SCRIPT")
                                var $edittemplate = $($(temp).html()).attr({ id: this._id + fName, name: this.model.columns[columnCount].field });
                            else
                                var $edittemplate = $(temp).attr({ id: this._id + fName, name: this.model.columns[columnCount].field });
                        }
                        else
                            var $edittemplate = $(temp1()).attr({ id: this._id + fName, name: this.model.columns[columnCount].field });
                    }
                    else
                        var $edittemplate = $(temp()).attr({ id: this._id + fName, name: this.model.columns[columnCount].field });
                    element.append($edittemplate);
                    break;
                case "stringedit":
                    element.html(ej.buildTag('input.e-field e-ejinputtext', "", {}, { value: "{{html:" + braces + "#data['" + splits.join("'] || {})['") + "']}}", id: this._id + fName, name: this.model.columns[columnCount].field }));
                    break;
                case "booleanedit":
                    element.html('{{if #data["' + splits.join('"]["') + '"]}} <input class="e-field e-checkbox" type ="checkbox" id=' + this._id + fName + ' name=' + this.model.columns[columnCount].field + ' checked="checkbox"></input>{{else}} <input class="e-field e-checkbox" type ="checkbox" id=' + this._id + fName + ' name=' + this.model.columns[columnCount].field + ' > {{/if}}');
                    if (this.model.editSettings.editMode == "normal")
                        element.addClass("e-boolcell");
                    break;
                case "numericedit":
                    var $numericText = ej.buildTag('input.e-numerictextbox e-field', "", {}, { type: "text", value: "{{:" + braces + "#data['" + splits.join("'] || {})['") + "']}}", id: this._id + fName, name: this.model.columns[columnCount].field });
                    element.append($numericText);
                    break;
                case "datepicker":
                case "datetimepicker":
                    var $datePicker = ej.buildTag('input.e-' + this.model.columns[columnCount]["editType"] + ' e-field', "", {}, { type: "text", value: "{{:" + braces + "#data['" + splits.join("'] || {})['") + "']}}", id: this._id + fName, name: this.model.columns[columnCount].field });
                    element.append($datePicker);
                    break;
                case "dropdownedit":
                    var currColumn = this.model.columns[columnCount];
                    if (ej.isNullOrUndefined(currColumn.dataSource)) {
                        var arrayOfDatas; var selectedItems = [];
                        if (ej.isNullOrUndefined(currColumn.dataSource) && (this._dataSource() instanceof ej.DataManager && this._dataSource().adaptor instanceof ej.ForeignKeyAdaptor && currColumn.field == fk_Value)) {
                            data = this.model.dataSource.adaptor.foreignData[index];
                            $foreignkeyfield = this.model.dataSource.adaptor.key[index];
                            $foreignkeyvalue = this.model.dataSource.adaptor.value[index];
                            selectedItems = data;
                        }
                        var arrayOfDatas, field = currColumn.field;
                        if (ej.isNullOrUndefined(ej.getObject(field, this._dropDownManager)))
                            return;
                        arrayOfDatas = ej.getObject(field, this._dropDownManager);
                        var isObj = 0 in arrayOfDatas && typeof arrayOfDatas[0] == "object";
                        var uniqueData = uniqueData = ej.dataUtil.mergeSort(ej.distinct(arrayOfDatas, isObj ? field : undefined, isObj ? false : undefined));
                        if (selectedItems.length == 0) {
                            if (ej.isNullOrUndefined(currColumn.dataSource) && (this._dataSource() instanceof ej.DataManager && this._dataSource().adaptor instanceof ej.ForeignKeyAdaptor && currColumn.field == fk_Value)) {
                                for (var index = 0; index < uniqueData.length; index++)
                                    selectedItems.push({ text: uniqueData[index][0], value: uniqueData[index][1] });
                            }
                            else {
                                for (var index = 0; index < uniqueData.length; index++)
                                    selectedItems.push({ text: uniqueData[index], value: uniqueData[index] });
                            }
                        }
                    }
                    else
                        selectedItems = ej.isNullOrUndefined(currColumn.foreignKeyField) || !(currColumn.field in this._dropDownManager) ? currColumn.dataSource : ej.getObject(currColumn.foreignKeyField + "." + currColumn.foreignKeyValue, this._dropDownManager);
                    var dropDownTemplate;
                    var fieldName = ej.isNullOrUndefined(currColumn.foreignKeyField) ? currColumn.field : currColumn.foreignKeyField;
                    if (currColumn.foreignKeyValue)
                        dropDownTemplate = this._compiledDropDownTemplate(fieldName, currColumn.foreignKeyValue, currColumn.type, currColumn.format);
                    else if ((this._dataSource() instanceof ej.DataManager && this._dataSource().adaptor instanceof ej.ForeignKeyAdaptor) && (currColumn.field == fk_Value)) {
                        dropDownTemplate = this._compiledDropDownTemplate($foreignkeyfield ? $foreignkeyfield : "value", $foreignkeyvalue ? $foreignkeyvalue : "text", currColumn.type, currColumn.format);
                    }
                    else
                        dropDownTemplate = this._compiledDropDownTemplate("value", "text", currColumn.type, currColumn.format);
                    if (!ej.isNullOrUndefined(currColumn.editParams) && ((this._dataSource() instanceof ej.DataManager && (this._dataSource() instanceof ej.DataManager && this._dataSource().adaptor instanceof ej.ForeignKeyAdaptor)) && (currColumn.field == fk_Value)))
                        element.get(0).innerHTML = "<input data-value='{{:" + fk_fieldName + "}}'/>";
                    else
                        element.get(0).innerHTML = ["<select>", dropDownTemplate.render(selectedItems), "</select>"].join("");
                    element.find("select,input").prop({ id: this._id + fName, name: currColumn.field }).addClass("e-field e-dropdownlist");
                    break;
            }
        },
        addBatchEditTemplate: function () {
            if (this.model.columns.length == 0)
                return;
            var $outerDiv = ej.buildTag('div', "", { display: "none" }, { id: this._id + "_BulkEditTemplate" }), i, columnCount, $innerDiv;
            for (i = 0, columnCount = this.model.columns.length; i < columnCount; i++) {
                if (ej.isNullOrUndefined(this.model.columns[i]["commands"]) && (ej.isNullOrUndefined(this.model.columns[i]["template"])) ||
                    (this.model.columns[i]["template"] && this.model.columns[i]["allowEditing"] != false && this.model.columns[i]["field"])) {				 
                    $innerDiv = ej.buildTag('div', "", {}, { id: this.model.columns[i].field.replace(/\./g, ej.pvt.consts.complexPropertyMerge) + "_BulkEdit" });
                    this._initCellEditType(i, $innerDiv);
                    $outerDiv.append($innerDiv);
                }
                if (this.model.columns[i]["isPrimaryKey"] === true) {
                    this._primaryKeys.push($.trim(this.model.columns[i].field));
                    this._primaryKeys = $.unique(this._primaryKeys);
                }
                if (this.model.columns[i]["isIdentity"] === true) {
                    $innerDiv.find(".e-field").addClass("e-identity");
                    this._identityKeys.push($.trim(this.model.columns[i].field));
                    this._identityKeys = $.unique(this._identityKeys);
                }
            }
            if ($outerDiv.children().length)
                this._bulkEditTemplate = $outerDiv;

        },
        addExternalDialogEditingTemplate: function () {
            if (this.model.columns.length == 0)
                return;
			  var  $valueTd;
			   $valueTd = ej.buildTag('td', "", { "text-align": "left" }).addClass("e-rowcell");
            for (var columnCount = 0; columnCount < this.model.columns.length; columnCount++) {
                if (ej.isNullOrUndefined(this.model.columns[columnCount]["commands"]) && (!ej.isNullOrUndefined(this.model.columns[columnCount]["template"]) && this.model.columns[columnCount]["allowEditing"] != false && this.model.columns[columnCount]["field"]) && !ej.isNullOrUndefined(this.model.columns[columnCount].editTemplate))
                    this._initCellEditType(columnCount, $valueTd);
                if (this.model.columns[columnCount]["isPrimaryKey"] === true) {
                    this._primaryKeys.push($.trim(this.model.columns[columnCount].field));
                    this._primaryKeys = $.unique(this._primaryKeys);
                }
            }
            var $tbody = ej.buildTag('div', "", { 'display': 'none' });
            var $form = ej.buildTag('form.gridform', "", {}, { id: this._id + "EditForm" });
            var cloneElement;
            if (this.model.editSettings.editMode == "dialogtemplate" && this.model.editSettings.dialogEditorTemplateID != null)
                cloneElement = this.model.editSettings.dialogEditorTemplateID;
            else if (this.model.editSettings.editMode == "externalformtemplate" && this.model.editSettings.externalFormTemplateID != null) {
                cloneElement = this.model.editSettings.externalFormTemplateID;
                $form.addClass("e-display");
            }
            else {
                cloneElement = this.model.editSettings.inlineFormTemplateID;
                $form.addClass("e-display");
            }

            $form.html($(cloneElement).html());
            $tbody = this.renderDiaglogButton($form, $tbody);
            $.templates(this._id + "_JSONdialogTemplateMode", $tbody.html());
        },
        _editdblClickHandler: function (e) {
            var $target = $(e.target);
			if ($target.closest(".e-grid").attr("id") !== this._id) return;
            if ($target.hasClass("e-rowcell") || ($target.hasClass("e-tooltip") && $target.closest("td").hasClass("e-rowcell"))) {
                if (!this.model.isEdit || (this.model.editSettings.showAddNewRow && this.model.editSettings.editMode == "normal")) {
                    this._$currentTr = (this.model.scrollSettings.frozenColumns > 0 || this.model.scrollSettings.frozenRows > 0)
                        ? this.getRowByIndex($target.closest('tr').index())
                        : $target.closest('tr');
                    this.startEdit(this._$currentTr);
                }
            }
        },
        _columnToSelect: function () {
            var column = [];
            for (var i = 0; i < this.model.columns.length; i++) {
                if (this._dataSource() instanceof ej.DataManager && this._dataSource().adaptor instanceof ej.ForeignKeyAdaptor) {
                    if ($.inArray(this.model.columns[i].field, this._dataSource().adaptor.value) != -1)
                        if (ej.isNullOrUndefined(this.model.columns[i]["editType"]))
                        this.model.columns[i]["editType"] = "dropdownedit";
                }
                if (this.model.columns[i]["editType"] === ej.Grid.EditingType.Dropdown && ej.isNullOrUndefined(this.model.columns[i]["dataSource"]))
                    column.push(this.model.columns[i].field);
            }
            if (column.length)
                return { query: ej.Query().select(column), fields: column };
            return{ query: ej.Query(), fields: [] };
        },
        _renderExternalForm: function () {
            var $externalform = ej.buildTag("div", "", { display: "none" }, { id: this._id + "_externalEdit", 'class': "e-form-container" });
            var $eformHeader = ej.buildTag("div", "", "", { id: this._id + "_eFormHeader", 'class': "e-form-titlebar" });
            var $eformTitle = ej.buildTag("span", "", "", { 'class': "e-form-title" });
            var $eformToggleBtn = ej.buildTag("div", "", "", { id: this._id + "_eFormToggleBtn", 'class': "e-form-togglebtn" });
            var $eformToggleIcon = ej.buildTag("span", "", "", { 'class': "e-form-toggle-icon e-icon" });
            $eformToggleBtn.append($eformToggleIcon);
            $eformHeader.append($eformTitle).append($eformToggleBtn);

            var $eformContent = ej.buildTag("div", "", "", { id: this._id + "_eFormContent", 'class': "e-form-content" });
            var $eform = ej.buildTag("div", "", "", { id: this._id + "_externalForm", 'class': "e-externalform" });
            var $contentOuterDiv = ej.buildTag("div", "", "", { 'class': "e-externalformedit" });
            $eform.append($contentOuterDiv);
            $eformContent.append($eform);
            return $externalform.append($eformHeader).append($eformContent);;
        },
        _buttonClick: function (e) {
            if (e.type == "close") {
                if (!this.model.isEdit)
                    return;
                this.model.isEdit = false;
                this.element.ejGrid("cancelEdit");
                this.refreshToolbar();
                return;
            }
            if (e.keyCode !== undefined && e.keyCode != 13 || this.model == null)
                return true;
            if (this.model.editSettings.editMode == "dialog" || this.model.editSettings.editMode == "dialogtemplate") {
                if (e.target.id == "EditDialog_" + this._id + "_Save") 
                    this.element.ejGrid("endEdit");
                 else if (e.target.id == "EditDialog_" + this._id + "_Cancel") {
                    this.element.ejGrid("cancelEdit");
                    $("#" + this._id + "_dialogEdit").ejDialog("close");
                }
            }
            else if (this.model.editSettings.editMode == "externalform" || this.model.editSettings.editMode == "externalformtemplate") {
                if ($(e.target).hasClass("e-form-toggle-icon")) {
                    this.element.ejGrid("cancelEdit");
                    $("#" + this._id + "_externalEdit").css("display", "none");
                }
                else {
                    if (e.target.id == "EditExternalForm_" + this._id + "_Save") {
                        if (this.element.ejGrid("endEdit").length !== undefined)
                            $("#" + this._id + "_externalEdit").css("display", "none");
                    } else if (e.target.id == "EditExternalForm_" + this._id + "_Cancel") {
                        this.element.ejGrid("cancelEdit");
                        $("#" + this._id + "_externalEdit").css("display", "none");
                    }
                }
            }
            else if (this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate") {
                if (e.target.id == "InlineEditForm_" + this._id + "_Save")
                    this.element.ejGrid("endEdit");
                else if (e.target.id == "InlineEditForm_" + this._id + "_Cancel")
                    this.element.ejGrid("cancelEdit");
            }
            else
                this.element.ejGrid("cancelEdit");
        },
        _enableEditingEvents: function () {
            if (this.model.editSettings.allowEditing || this.model.editSettings.allowAdding) {
                if (this.model.editSettings.allowEditing && this.model.editSettings.editMode != "batch" && this.model.editSettings.allowEditOnDblClick) 
                    this._on(this.element, ($.isFunction($.fn.doubletap) && this.model.enableTouch) ? "doubletap" : "dblclick", ".e-gridcontent", this._editdblClickHandler);
                else {
                    this._off(this.element, "dblclick", ".e-gridcontent");
                    this._off(this.element, "doubletap", ".e-gridcontent");
                }
                this._off($("#" + this._id + "_dialogEdit"), "click keypress", "#EditDialog_" + this._id + "_Save ,#EditDialog_" + this._id + "_Cancel");
                if (this.model.editSettings.editMode == "dialog" || this.model.editSettings.editMode == "dialogtemplate") {
                    this._on($("#" + this._id + "_dialogEdit"), "click keypress", "#EditDialog_" + this._id + "_Save ,#EditDialog_" + this._id + "_Cancel", this._buttonClick);
                }
                else if (this.model.editSettings.editMode == "externalform" || this.model.editSettings.editMode == "externalformtemplate") {
                    this._on($("#" + this._id + "_externalEdit"), "click keypress", "#EditExternalForm_" + this._id + "_Save ,#EditExternalForm_" + this._id + "_Cancel", this._buttonClick);
                    $(this.element).on("click", ".e-form-toggle-icon", $.proxy(this._buttonClick, this));
                }
                else if (this.model.editSettings.editMode == "batch") {
                    this._on($(document), "mousedown", this._saveCellHandler);
					this._batchEnabled = true;
				}

                else if (this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate")
                    $(this.element).on("click keypress", "#InlineEditForm_" + this._id + "_Save ,#InlineEditForm_" + this._id + "_Cancel", $.proxy(this._buttonClick, this));
				
				if (this.model.editSettings.editMode != "batch" && this._batchEnabled) {
                    this._off($(document), "mousedown", this._saveCellHandler);
					this._batchEnabled = false;
				}

            } else {
                this._off($("#" + this._id + "_dialogEdit"), "click", "#EditDialog_" + this._id + "_Save ,#EditDialog_" + this._id + "_Cancel");
                $(this.element).off("click", ".e-icon");
                this._off($("#" + this._id + "_externalEdit"), "click", "#EditExternalForm_" + this._id + "_Save ,#EditExternalForm_" + this._id + "_Cancel");
                $(this.element).off("click", ".e-form-toggle-icon");
                $(this.element).off("click", "#InlineEditForm_" + this._id + "_Save ,#InlineEditForm_" + this._id + "_Cancel");
            }
        },
        _multiRowDelete: function () {
            var changes = {};
            changes.added = []; changes.deleted = [], changes.changed = [];
            changes.deleted = this.getSelectedRecords();
            var args = {};
			args.data = this.getSelectedRecords();
            args.tr = this.getSelectedRows();
            args.requestType = "delete";
            var gridObject = this;
            this._sendBulkReuqest(changes, args);
        },
        deleteRow: function ($tr) {
            if (!this.model.editSettings.allowDeleting || (this.model.isEdit && this.model.editSettings.editMode != "batch" && !this.model.editSettings.showAddNewRow))
                return;
            if (this.model.editSettings.showDeleteConfirmDialog && !(this._confirmDialog).is(":visible")) {
                this._cDeleteData = $tr;
                this._confirmDialog.find(".e-content").html(this.localizedLabels.ConfirmDelete).end().ejDialog("open");
                return;
            }
            if ($.isArray($tr)) {
                this.selectRows($tr);
                this._multiRowDelete();
            }
            else {
                if (this.model.editSettings.editMode == "batch")
                    this._bulkDelete(this.getIndexByRow($tr));
                else {
                    if (this._primaryKeys.length == 0 && !this.model.editSettings.allowEditing && !this.model.editSettings.allowAdding) {
                        for (i = 0; i < this.model.columns.length; i++) {
                            if (this.model.columns[i]["isPrimaryKey"] === true) {
                                this._primaryKeys.push($.trim(this.model.columns[i].field));
                                this._primaryKeys = $.unique(this._primaryKeys);
                            }
                        }
                    }
                    if (this._selectedRow() == -1 && ej.isNullOrUndefined($tr)) {
                        alert(this.localizedLabels.DeleteOperationAlert);
                        return;
                    }
                    if (ej.isNullOrUndefined($tr))
                        $tr = this.getRowByIndex(this._selectedRow());
                    this._primaryKeyValues = [];
                    for (var index = 0; index < this._primaryKeys.length; index++) {
                        var column = this.getColumnByField(this._primaryKeys[index]);
                        var trIndex = this.getIndexByRow($tr);
                        this._primaryKeyValues.push(this._currentJsonData[trIndex][column.field]);
                    }
                    var deleteManager = ej.DataManager(this._currentJsonData);
                    var query = new ej.Query();
                    for (var i = 0; i < this._primaryKeys.length; i++)
                        query = query.where(this._primaryKeys[i], ej.FilterOperators.equal, this._primaryKeyValues[i]);
                    currentData = deleteManager.executeLocal(query);
                    var args = {};
                    args.tr = $tr;
                    args.data = currentData[0];
                    var foreignKeyData = this._getForeignKeyData(args.data);
                    if (!ej.isNullOrUndefined(foreignKeyData))
                        args.foreignKeyData = foreignKeyData;
                    args.requestType = ej.Grid.Actions.Delete;
                    if (this._trigger("actionBegin", args))
                        return true;
                    this._cDeleteData = currentData;
                    var promise;
                    if (this._dataSource() instanceof ej.DataManager && (!this._dataManager.dataSource.offline && this._dataManager.dataSource.json !== undefined) || (this._dataSource().adaptor instanceof ej.remoteSaveAdaptor)) {
                        promise = this._dataManager.remove(this._primaryKeys[0], currentData[0][this._primaryKeys[0]], this.model.query);
                        var proxy = this;
                        if ($.isFunction(promise.promise)) {
                            promise.done(function (e) {
                                proxy._processBindings(args);
                                proxy._primaryKeyValues = [];
                                proxy._cDeleteData = null;
                            });
                            promise.fail(function (e) {
                                args.error = e
                                proxy._trigger("actionFailure", args)
                            });
                        } else
                            this._processBindings(args);
                    } else
                        this._processBindings(args);
                    if (promise == undefined || !$.isFunction(promise.promise)) {
                        this._primaryKeyValues = [];
                        this._cDeleteData = null;
                    }
                }
            }
        },
        
        _htmlEncode: function (html) {
            str = html;
            if (!ej.isNullOrUndefined(str))
                str = isNaN(str) ? str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, '\'') : str;
            return str;
        },
        startEdit: function ($tr) {
		    if (!this.model.editSettings.allowEditing || (this.model.editSettings.showAddNewRow && this.model.editSettings.editMode == "normal" && this._excludeDetailRows().hasClass("e-editedrow")))
		        return;
		    if (this.element.ejWaitingPopup("model.showOnInit"))
		        return;
            if (this._selectedRow() == -1 && ej.isNullOrUndefined($tr)) {
                alert(this.localizedLabels.EditOperationAlert);
                return;
            }
            if (ej.isNullOrUndefined($tr)) {
                this._currentTrIndex = this._selectedRow();
                this._$currentTr = this.getRowByIndex(this._currentTrIndex);
            } else {
                this._currentTrIndex = this.getIndexByRow($tr);
                this._$currentTr = $tr;
            }
            if (!$(this._$currentTr).is(":visible"))
                return false;
            this._primaryKeyValues = [];
            for (var index = 0; index < this._primaryKeys.length; index++) {
                var column = this.getColumnByField(this._primaryKeys[index]);
                var trIndex = this.getIndexByRow(this._$currentTr);
                this._primaryKeyValues.push(this._htmlEncode(this._currentJsonData[trIndex][column.field]));
            }
            var args = { row: this._$currentTr, rowIndex: this._currentTrIndex, primaryKey: this._primaryKeys, primaryKeyValue: this._primaryKeyValues };
            var cancel = this._trigger("beginEdit", args);
            if (cancel) {
                this._primaryKeyValues = [];
                return;
            }
            args.requestType = ej.Grid.Actions.BeginEdit;
            this._processBindings(args);

        },
         _startAdd: function() {
            if (!this.model.editSettings.allowAdding)
                return;
			this._isAddNew = true;
            if (this.model.editSettings.editMode == "batch")
                this._bulkAddRow();
            else {
                var cloneData = {}, cols = this.model.columns;
                for (var i = 0; i < cols.length; i++) {
                    if (!ej.isNullOrUndefined(this.model.parentDetails) && cols[i].field == this.model.parentDetails.parentKeyField)
                        cols[i].defaultValue = this.model.parentDetails.parentKeyFieldValue;
                    if (!ej.isNullOrUndefined(cols[i].field) && cols[i].field.indexOf(".") > 0)
                        ej.createObject(cols[i].field, cols[i].defaultValue || "", cloneData);
                    else
                        cloneData[cols[i].field] = !ej.isNullOrUndefined(cols[i].defaultValue) ? cols[i].defaultValue : (cols[i].type == "date" || cols[i].type == "datetime") ? null : "";
                }
                var args = {}, complexObject = {};
                args.data = cloneData;
                if (this.model.editSettings.editMode.indexOf('template') != -1) {
                    for (var i = 0; i < this.model.columns.length; i++) {
                        if (!ej.isNullOrUndefined(this.model.columns[i].field) && this.model.columns[i].field.indexOf(".") != -1) {
                            var splits = this.model.columns[i].field.split('.');
                            ej.createObject(this.model.columns[i].field, args.data[this.model.columns[i].field], complexObject);
                            args.data[splits[0]] = complexObject;
                            delete args.data[this.model.columns[i].field];
                        }
                    }
                }
                var foreignKeyData = this._getForeignKeyData(args.data);
                if (!ej.isNullOrUndefined(foreignKeyData))
                    args.foreignKeyData = foreignKeyData;
                args.requestType = "add";
                this.clearSelection();
                var returnValue = this._processBindings(args);
                if (!returnValue)
                    this.model.editSettings.showAddNewRow ? this._selectedRow(-1) : this._selectedRow(0);
                var groupedColumns = this.model.groupSettings.groupedColumns.length;
                if (groupedColumns > 1) {
                    var $editCol = this.getContentTable().find(".e-addedrow").find("table").find("colgroup").children();
                    $($editCol.slice(0, groupedColumns - 1)).css('width', this.getHeaderTable().find('colgroup').children()[0].style.width);
                }
            }
        },
        
        endEdit: function () {
            if (this.model.isEdit) {
                var formElement, $formElement, editedTr, count = 0;
                if (!this.editFormValidate())
                    return true;
                var obj = {};
                var editedRowWrap, type;
                if (this.model.editSettings.editMode == "batch")
                    this.saveCell();
                else {
					if(this.model.editSettings.showAddNewRow)
						editedTr = this.getContentTable().find(".e-editedrow");
                    formElement = this.model.scrollSettings.frozenColumns > 0 ? this.element.find(".gridform") : !ej.isNullOrUndefined(editedTr) && editedTr.length == 1 ? editedTr[0].lastChild.lastChild: document.getElementById(this._id + "EditForm");
                    $formElement = $(formElement);
                    if (this.model.editSettings.editMode == "normal" || this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate")
                        editedRowWrap = $formElement.closest('tr');
                    else
                        editedRowWrap = $formElement.closest('div');
                    editedRowWrap.find('td.e-rowcell').removeClass('e-validError');
                    formElement = this.model.scrollSettings.frozenColumns > 0 ? formElement[0] : formElement;
                    for (var index = 0; index < formElement.length; index++) {
                        if (editedRowWrap.hasClass("e-addedrow") && $(formElement[index]).hasClass("e-identity"))
                            continue;
                        var columnName = formElement[index].name, $element = $(formElement[index]), column = this.getColumnByField(columnName);
                        if ($element.hasClass("e-dropdownlist e-input") && $element.attr("id").indexOf("_input") != -1 && ej.isNullOrUndefined($formElement[1]))
                            continue;
                        if (columnName != undefined) {
                            if (columnName == "" || ej.isNullOrUndefined(column)) {
                                if (formElement[index].id.indexOf("Save") != -1 || formElement[index].id.indexOf("Cancel")!= -1)
                                    columnName = "";
                                else
                                    columnName = formElement[index].id.replace(this._id, "");
                            }
                            if (columnName != "" && obj[columnName] == null) {
                                column = this.getColumnByField(columnName);
                                var  value = formElement[index].value, checkType = formElement[index].type, checkState = $(formElement[index]).is(':checked'),
                                    type = column ? column.originalType : null;
                                if (!ej.isNullOrUndefined(column) && (column.editType == "edittemplate")) {
                                    if ($(formElement[index]).is("#" + this._id + columnName)) {
                                        var temp1 = column.editTemplate.read; $element = $(formElement[index]);
                                        if (typeof temp1 == "string")
                                            temp1 = ej.util.getObject(temp1, window);
                                        value = temp1($element);
                                    }
                                    else
                                        continue;
                                }
                                else if ($(formElement[index]).hasClass("e-datepicker")) {
                                    value = $element.ejDatePicker("model.value");
                                }
                                else if ($(formElement[index]).hasClass("e-datetimepicker")) {
                                    value = $element.ejDateTimePicker("model.value");
                                }
                                else if ($element.is(".e-numerictextbox")) {
                                    value = $element.ejNumericTextbox("getValue");
                                    if (column.type == "string" && !ej.isNullOrUndefined(value))
                                        value = value.toString();
								}
								else if ($element.data("ejDropDownList")) {
                                    value = $element.ejDropDownList("getSelectedValue");
                                    if (!ej.isNullOrUndefined(column) && !ej.isNullOrUndefined(column.format) && (column.type == "date" || column.type == "datetime"))
                                         value = value.length > 0 ? new Date(value) : value;
                                
								}
                                if (type)
                                    value = type == "number" ? +value : type == "boolean" ? (value === this.localizedLabels.True ? true : false) : type === "date" ? new Date(value) : value;
                                if (column == null)
                                    value = !isNaN(parseFloat(value)) && isFinite(value) ? parseFloat(value) : value;
                                else if (column.type == "number" && !ej.isNullOrUndefined(value) && value.length)
                                    value = ej.parseFloat(value,this.model.locale);
                                if (typeof value == "string" && !value.length)
                                    value = null;
                                if ((checkType != "checkbox" && !ej.isNullOrUndefined(value) && value !== "") || checkState)
                                    count++;
                                var originalvalue;
                                if (checkType != "checkbox")
                                    originalvalue = value;
                            	else
                                    originalvalue = checkState;
                            if (columnName.indexOf(".") != -1)
                                ej.createObject(columnName, originalvalue, obj);
                            else
                                obj[columnName] = originalvalue;
                            }
                        }
                        if (index == formElement.length - 1 && $formElement.length > 1 && $formElement.index(formElement) == 0) {
                            formElement = $formElement[1];
                            index = -1;
                        }

                    }
                    var args = { data: obj };
                    var foreignKeyData = this._getForeignKeyData(args.data);
                    if (!ej.isNullOrUndefined(foreignKeyData))
                        args.foreignKeyData = foreignKeyData;
                    args.requestType = ej.Grid.Actions.Save;
                    args.selectedRow = this._selectedRow();
                    args.previousData = this.model.currentViewData[args.selectedRow];
                    var currentData;
                    if (this._trigger("actionBegin", args))
                        return true;
                    if (editedRowWrap.hasClass("e-editedrow")) {
                        this._cModifiedData = obj;
                        args.action = "edit";
                    } else if (editedRowWrap.hasClass("e-addedrow")) {
                        if (count)
                            this._cAddedRecord = obj;
                        args.action = "add";
                    }
                    if (args.action == "add" && this.editFormValidate()) {
                        if (!count) {
                            elements = this.model.scrollSettings.frozenColumns > 0 ? this.element.find(".gridform") : $("#" + this._id + "EditForm");
                            var error = ej.buildTag("div");
                            var element = elements.find("input:visible").not(".e-identity").first();
                            this._renderValidator(error, element);
                            $errorMessage = ej.buildTag("div.e-field-validation-error", this.localizedLabels.EmptyRowValidationMessage);
                            $tail = $(error).find(".e-errortail");
                            $errorMessage.insertAfter($tail);
                            $errorMessage.css("display", "block");
                            return false;
                        }
                    }
                    this._updateAction(args);
                }
            }
        },
        _updateAction: function (args) {
            var promise;
            if (this._dataSource() instanceof ej.DataManager && (!this._dataManager.dataSource.offline && this._dataManager.dataSource.json !== undefined) || (this._dataSource().adaptor instanceof ej.remoteSaveAdaptor) || this._dataSource().adaptor instanceof ej.ForeignKeyAdaptor) {
                if (this.model.editSettings.editMode == 'batch') {
                    this.batchChanges.added.push(args.data);
                    this.batchSave();
                }
                else {
                    if (!ej.isNullOrUndefined(this._cModifiedData))
                        promise = this._dataManager.update(this._primaryKeys[0], args.data, this.model.query);
                    else
                        promise = this._dataManager.insert(args.data, this.model.query);
                    var proxy = this;
                    this.element.ejWaitingPopup("show");
                    if ($.isFunction(promise.promise)) {
                        promise.done(function (e) {
                            proxy.model.isEdit = false;
                            if (!ej.isNullOrUndefined(e) && $.isPlainObject(e.record)) {
                                $.extend(args.data, e.record);
                                if (args.action == "add")
                                    proxy._cAddedRecord = args.data;
                                if (args.action == "edit")
                                    proxy._cModifiedData = args.data;
                            }
                            proxy._processBindings(args);
                            if (proxy._isRemoteSaveAdaptor) {
                                proxy.element.ejWaitingPopup("hide");
                                if (!ej.isNullOrUndefined(proxy._unboundRow) && args.selectedRow != proxy._unboundRow && args.requestType == "save") {
                                    proxy._unboundRow.find(".e-editbutton").trigger("click");
                                    proxy._unboundRow = null;
                                }
                            }
                            proxy._cModifiedData = null;
                            proxy._cAddedRecord = null;
                            proxy._primaryKeyValues = [];
                        });
                        promise.fail(function (e) {
                            args.error = (e && e.error) ? e.error : e;
                            proxy._cModifiedData = null;
                            proxy._cAddedRecord = null;
                            proxy.element.ejWaitingPopup("hide");
                            proxy._trigger("actionFailure", args)
                        });
                    } else {
                        proxy.model.isEdit = false;
                        proxy._processBindings(args);
                    }
                }
            } else
                this._processBindings(args);
            if (promise == undefined || !$.isFunction(promise.promise)) {
                this._cModifiedData = null;
                this._cAddedRecord = null;
                this._primaryKeyValues = [];
            }
        },
        
        cancelEdit: function () {
            var args = {};
            args.requestType = ej.Grid.Actions.Cancel;
            this._cModifiedData = null;
            this._processBindings(args);
            this._primaryKeyValues = [];
            this._currentData = null;
        },
        
        refreshToolbar: function () {
            var $toolbar = $("#" + this._id + "_toolbarItems");
            var lis = $toolbar.find("li");
            $toolbar.ejToolbar("enableItem", lis);
			var editedTr = this.getContentTable().find(".e-editedrow");
			if(this.model.editSettings.showAddNewRow && this.model.editSettings.editMode == "normal" && editedTr.length==0)
				this._disabledToolItems.push(lis.filter('[id='+this._id+'_add]'));
			else
			{
			    for (var i = 0; i < lis.length; i++) {
			        switch (lis[i].id) {
			            case this._id + "_add":
			            case this._id + "_edit":
			            case this._id + "_delete":
			            case this._id + "_responsiveFilter":
			            case this._id + "_responsiveSorting":
			            case this._id + "_search":
			                if (this.model.isEdit) {
			                    if (!(this.model.editSettings.showAddNewRow && this.model.editSettings.editMode == "normal") || editedTr.length != 0) {
			                        $(lis[i]).hasClass("e-hover") && $(lis[i]).removeClass("e-hover");
			                        this._disabledToolItems.push(lis[i]);
			                    }
			                }
			                else if (!this.model.enableToolbarItems && !this.model.editSettings.allowAdding && lis[i].id == this._id + "_add")
			                        this._disabledToolItems.push(lis[i]);
                            else if (!this.model.enableToolbarItems && !this.model.editSettings.allowEditing && lis[i].id == this._id + "_edit")
                                    this._disabledToolItems.push(lis[i]);
                            else if (!this.model.enableToolbarItems && !this.model.editSettings.allowDeleting && lis[i].id == this._id + "_delete")
                                    this._disabledToolItems.push(lis[i]);
			                break;
			            case this._id + "_update":
			            case this._id + "_cancel":
			                if (!this.model.isEdit) {
			                    $(lis[i]).hasClass("e-hover") && $(lis[i]).removeClass("e-hover");
			                    this._disabledToolItems.push(lis[i]);
			                }
			                break;
			        }
			    }
			}
            $toolbar.ejToolbar("disableItem", this._disabledToolItems);
            $toolbar.ejToolbar("model.enableRTL", this.model.enableRTL);
            this._disabledToolItems = $();

        },
        _getHiddenCount: function (elements) {
            var count = 0;
            for (var i = 0; i < elements.length; i++) {
                if (elements.eq(i).hasClass("e-hide"))
                    count++;
            }
            return count;
        },
        _refreshTemplateCell: function (temp, data) {
            var tempcell = temp.find('.e-templatecell');
			for(var i =0; i< tempcell.length;i++){						
				var args = { cell: tempcell[i], data: data, column: this.model.columns[$(tempcell[i]).index()], rowIndex: temp.index()};
				this._trigger("templateRefresh", args);	
			}			
        },
        _edit: function (args) {
            var editingManager = ej.DataManager(this._currentJsonData), $tempFirstTR;
            var queryManager = new ej.Query();
            if (this.model.allowFiltering)
                this._previousFilterCount = this._filteredRecordsCount;
            for (var index = 0; index < this._primaryKeys.length; index++)
                queryManager = queryManager.where(this._primaryKeys[index], ej.FilterOperators.equal, this._primaryKeyValues[index]);
            this._currentData = editingManager.executeLocal(queryManager);
            var temp = document.createElement('div');
            var formTitle = !ej.isNullOrUndefined(this.model.editSettings.titleColumn) ? this.model.editSettings.titleColumn : this._primaryKeys[0];
            var $temp = $(temp), $tempSecondTR;
            if (this.model.editSettings.editMode == "normal") {
                temp.innerHTML = ['<table>', $.render[this._id + "_JSONEditingTemplate"](this._currentData, { groupedColumns: this.model.groupSettings.groupedColumns }), '</table>'].join("");
                var $tr = $temp.find("tr").first(), detailCount = 0, firstHidden = this.model.columns.length
                , $currentTrFr = args.row.first();
                if (this.model.scrollSettings.frozenColumns > 0) {
                    $temp.prepend(['<table>', $.render[this._id + "_JSONFrozenEditingTemplate"](this._currentData, { groupedColumns: this.model.groupSettings.groupedColumns }), '</table>'].join(""));
                    $tr.splice(0, 0, $temp.find("table").first().find("tr").first().get(0));
                    $currentTrLa = args.row.last();
                    $tempLastTR = $tr.last();
                }
                $tempFirstTR = $temp.find("tr").first();
                $temp.find('td').not(".e-rowcell").addClass("e-editcell e-normaledit");
                this._setEditDropdownValue($temp);
                if (this.model.groupSettings.groupedColumns.length >= 2) {
                    var $indentCell = args.row.find("td.e-indentcell");
                    $temp.find("tr").first().prepend($indentCell);
                }
                if (this.model.detailsTemplate != null || this.model.childGrid != null) {
                    detailCount++;                    
                    $temp.find(".e-editcell").find("tr").prepend(args.row.find("[class^=e-detailrow]").removeClass("e-selectionbackground e-active"));
                    if (this.model.gridLines != "both")
                        $temp.find(".e-editcell .e-rowcell:first").addClass("e-detailrowvisible");
                }
                if (this.model.scrollSettings.frozenColumns > 0) {
                    $temp.find(".e-editcell").get(1).colSpan = this.model.columns.length - this.model.scrollSettings.frozenColumns - args.row.last().find(".e-hide").length + detailCount;
                    firstHidden = this.model.scrollSettings.frozenColumns;
                    $currentTrLa.hasClass("e-alt_row") && $tempLastTR.addClass("e-alt_row")
                }
                $temp.find(".e-editcell").get(0).colSpan = firstHidden - $currentTrFr.find("td").not(":visible").length + detailCount;
                $currentTrFr.hasClass("e-alt_row") && $tempFirstTR.addClass("e-alt_row");                
                $currentTrFr.empty().replaceWith($tempFirstTR.addClass("e-editedrow"));
                if (!$tempFirstTR.is(":last-child"))
                    $tempFirstTR.find('td.e-rowcell').addClass('e-validError');
                if (this.model.scrollSettings.frozenColumns > 0)
                    $currentTrLa.empty().replaceWith($tempLastTR.addClass("e-editedrow"));
                this._refreshUnboundTemplate($tr.find(".gridform"));
                if(this.model.scrollSettings.frozenColumns == 0)
					this._gridRows = this.getContentTable().first().find(".e-rowcell").closest("tr.e-row, tr.e-alt_row, tr.e-editedrow").toArray();
				else
					this._gridRows = $(this.getContentTable().get(0).rows).toArray();                 
                if (this.model.scrollSettings.frozenColumns > 0) {
					this.getScrollObject().scrollY(this.getScrollObject().model.scrollTop, true);
                    this._gridRows = [this._gridRows, $(this.getContentTable().get(1).rows).toArray()];
				}
            }
            else if (this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate") {
                var hideCount = !this.model.groupSettings.showGroupedColumn ? this.model.groupSettings.groupedColumns.length : 0;
                var detailCount = 0;
                temp.innerHTML = this.model.editSettings.editMode == "inlineform" ? $.render[this._id + "_JSONDialogEditingTemplate"](this._currentData) : $.render[this._id + "_JSONdialogTemplateMode"](this._currentData);
				this._setEditDropdownValue($temp);
                var tr = ej.buildTag('tr');
                var td = ej.buildTag('td');
                tr.addClass("e-editedrow");
                td.addClass("e-inlineformedit");
                temp = $(temp).clone(true).children();
                td.html(temp);
                tr.append(td);
                if (!tr.is(":last-child"))
                    tr.find('.e-rowcell').addClass('e-validError');
                if (this.model.scrollSettings.frozenColumns > 0) {
                    var $trClone = tr.clone();
                    $trClone.find("td").empty().prop("colspan", this.model.scrollSettings.frozenColumns);
                    args.row.eq(1).after(tr).end().eq(0).after($trClone);
                    this._gridRows = [this._gridRows, this.getContentTable().last().find("tr").toArray()];
                }
                else
                    args.row.after(tr);
                this._gridRows = this.getContentTable().first().find(".e-rowcell,.e-inlineformedit").closest("tr").toArray();
				if (this.model.detailsTemplate != null || this.model.childGrid != null)
                        detailCount++;
                if (this.model.scrollSettings.frozenColumns > 0)
                    td.prop("colspan", this.model.columns.length - this.model.scrollSettings.frozenColumns - tr.find("form").children().not(":visible").length - hideCount + detailCount);
                else
                    td.prop("colspan", this.model.columns.length - this._hiddenColumns.length - hideCount + detailCount);
                if (this.model.scrollSettings.frozenColumns > 0)
                    this._gridRows = [this._gridRows, this.getContentTable().last().find("tr").toArray()];
                $("#" + this._id + "_inlineFormTitle").text(this.localizedLabels.EditFormTitle + this._currentData[0][formTitle]);
                args.row.find("input").attr('disabled', 'disabled').addClass("e-disable");
            }
            else {
                $temp.addClass("e-editedrow");
                temp.innerHTML = this.model.editSettings.editMode == "dialog" || this.model.editSettings.editMode == "externalform" ? $.render[this._id + "_JSONDialogEditingTemplate"](this._currentData) : $.render[this._id + "_JSONdialogTemplateMode"](this._currentData);
                this._setEditDropdownValue($temp);
                if (this.model.editSettings.editMode == "dialog" || this.model.editSettings.editMode == "dialogtemplate") {
                    $("#" + this._id + "_dialogEdit").html($(temp));
                    var model = {};
                    model.cssClass = this.model.cssClass;
                    model.enableRTL = this.model.enableRTL;
                    model.width = "auto";
                    model.enableResize = this.phoneMode;
                    model.close = $.proxy(this._buttonClick, this);
                    model.content = "#" + this._id;
                    model.enableModal = true;
                    model.allowKeyboardNavigation = false;
                    model.title = this.localizedLabels.EditFormTitle + this._currentData[0][formTitle];
                    $("#" + this._id + "_dialogEdit").ejDialog(model);
                    $("#" + this._id + "_dialogEdit").ejDialog("open");
                }
                else {
                    $("#" + this._id + "_externalEdit").css("display", "block").css('z-index', this._maxZindex() + 1);
                    $("#" + this._id + "_externalForm").find(".e-externalformedit").html($(temp));
                    $("#" + this._id + "_eFormHeader").find(".e-form-title").text(this.localizedLabels.EditFormTitle + this._currentData[0][formTitle]);
                    this._externalFormPosition();
                    args.row.find("input").attr('disabled', 'disabled').addClass("e-disable");
                }
            }
            if (this.model.editSettings.editMode != "normal")
                $tempFirstTR = $(temp);
			if(!ej.isNullOrUndefined(this.model.templateRefresh) && $tempFirstTR.find(".e-templatecell").length != 0) 
				this._refreshTemplateCell($tempFirstTR, this.model.currentViewData[$tempFirstTR.index()]);
        },
        _setEditDropdownValue: function ($temp) {
            var $select = $temp.find("select.e-field"), x, inputDrop = $temp.find("input.e-field.e-dropdownlist");
            for (var i = 0; i < $select.length; i++) {
                var ddlTemplate = {}, opPara = "";
                if ($select[i].name.indexOf('.') != -1) {
                    for (var j = 1; j < $select[i].name.split(".").length; j++)
                        opPara = opPara.concat("(");
                    ddlTemplate[this._id + "ddlTemp"] = "{{:" + opPara + "#data['" + $select[i].name.split('.').join("'] || {})['") + "']}}";
                }
                else
                    ddlTemplate[this._id + "ddlTemp"] = "{{:" + $select[i].name.replace(/[^a-z0-9\s_]/gi, '') + "}}"
                $.templates(ddlTemplate);
                x = $.render[this._id + "ddlTemp"](this._currentData);
                var $selOptions = $temp.find('select:eq(' + i + ') option[value="' + x + '"]');
                var curColumn = this.getColumnByField($select[i].name);
                if (this._dataSource().adaptor instanceof ej.ForeignKeyAdaptor && this._dataSource().adaptor.value.indexOf(curColumn.field) != -1){
				    $selOptions = $temp.find('select:eq(' + i + ') option:contains("' + x + '")');
					$select.eq(i).val($selOptions[0].value);
				}
                $selOptions.attr("selected", "selected");
            }
            for (var j = 0; j < inputDrop.length; j++) {
                inputDrop.eq(j).val(ej.getObject(inputDrop.eq(j).attr("name"), this._currentData[0]));
            }
        },
        _add: function (args) {
            var temp = document.createElement('div'), $editTr;
            if (this._isLocalData && this.model.groupSettings.groupedColumns.length == 0 && this.model.scrollSettings.frozenColumns == 0 && this.model.scrollSettings.frozenRows == 0)
                !(this._dataSource() instanceof ej.DataManager) ? this._dataSource().splice(0, 1) : this._dataSource().dataSource.json.splice(0, 1);
            this._previousFilterCount = this._filteredRecordsCount;
            if (this.model.editSettings.editMode == "normal") {
                var $tempFirstTR, $temp = $(temp), frozenColSpan = this.model.columns.length;
                temp.innerHTML = ['<table>', $.render[this._id + "_JSONEditingTemplate"](args.data, { groupedColumns: this.model.groupSettings.groupedColumns }), '</table>'].join("");
                var $select = $(temp).find('select.e-field');
                for (var i = 0; i < $select.length; i++)
                    $select.eq(i).val(args.data[$select[i].name]);
                if (this.model.scrollSettings.frozenColumns > 0) {
                    $tempLastTR = $temp.find("table").first().find("tr").first();
                    $temp.prepend(['<table>', $.render[this._id + "_JSONFrozenEditingTemplate"](args.data, { groupedColumns: this.model.groupSettings.groupedColumns }), '</table>'].join(""));
					$($tempLastTR).find("td").first().addClass("e-editcell");
                }
                $tempFirstTR = $temp.find("tr").first();
                var td = $(temp).find(".e-editcell").get(0);
                $(temp).find('td').first().addClass("e-editcell");
                if (this.model.allowPaging && this.model.pageSettings.pageSize <= this._currentJsonData.length && this.model.groupSettings.groupedColumns.length == 0 && !this.model.editSettings.showAddNewRow)
                    this.getContentTable().get(0).lastChild.removeChild(this.getContentTable().get(0).lastChild.lastChild);
                if ((this.model.detailsTemplate != null || this.model.childGrid != null) && $(this.getContentTable().get(0).lastChild.lastChild).children('.e-detailrowexpand').length)
                    this.getContentTable().get(0).lastChild.removeChild(this.getContentTable().get(0).lastChild.lastChild);
                if (this.model.currentViewData.length == 0 || this.getContentTable().find('td.e-rowcell').length == 0){
                    this.getContentTable().find('tr').first().replaceWith($(temp).find("tr").first().addClass("e-addedrow e-normaledit"));
					if(this.getContentTable().find('tr').length == 0) 
						this.getContentTable().append($(temp).find("tr").first().addClass("e-addedrow e-normaledit"));
				}
                else {
					var  $contentTbody = this.getContentTable().first().find('tbody').first();
                    if (this.model.editSettings.rowPosition == "top")
                        $contentTbody.prepend($tempFirstTR.addClass("e-addedrow e-normaledit"));
                    else if (this.model.editSettings.rowPosition == "bottom")
                        $contentTbody.append($tempFirstTR.addClass("e-addedrow e-normaledit"));
                    if (this.model.scrollSettings.frozenColumns > 0)
                        this.getContentTable().last().find('tbody').first().prepend($tempLastTR.addClass("e-addedrow e-normaledit"));
                }
                $editTr = this.getContentTable().find("tr.e-addedrow");
                if (this.model.detailsTemplate != null || this.model.childGrid != null)
                    $editTr.find('tr').first().prepend(ej.buildTag('td.e-detailrowcollapse'));
                var hideCount = !this.model.groupSettings.showGroupedColumn ? this.model.groupSettings.groupedColumns.length : 0;
                if (this.model.groupSettings.groupedColumns.length) {
                    for (var i = 0; i < this.model.groupSettings.groupedColumns.length; i++) {
                        if (i == 0)
                            $editTr.prepend(ej.buildTag("td.e-indentcell"));
                        else {
                            $editTr.find("tr").prepend(ej.buildTag("td.e-indentcell"));
                        }
                    }
                    if (this.model.groupSettings.groupedColumns.length > 0 && (this.model.detailsTemplate != null || this.model.childGrid != null))
                        $editTr.find("td.e-editcell").prop("colspan", (this.model.columns.length + (this.model.groupSettings.groupedColumns.length) - this._hiddenColumns.length - hideCount));
                    else if (this.model.groupSettings.groupedColumns.length >= 2)
                        $editTr.find("td.e-editcell").prop("colspan", (this.model.columns.length + (this.model.groupSettings.groupedColumns.length - 1) - this._hiddenColumns.length - hideCount));
                    else
                        $editTr.find("td.e-editcell").prop("colspan", (this.model.columns.length - this._hiddenColumns.length - hideCount));
                } else if (this.model.detailsTemplate != null || this.model.childGrid != null)
                    $editTr.find(".e-editcell").prop("colspan", (this.model.columns.length - this._hiddenColumns.length - hideCount + 1));
                else {
                    if (this.model.scrollSettings.frozenColumns > 0) {
                        $editTr.find(".e-editcell").last().prop("colspan", (this.model.columns.length - this.model.scrollSettings.frozenColumns - $tempLastTR.find("td").not(":visible").length - hideCount));
                        frozenColSpan = this.model.scrollSettings.frozenColumns;
                    }
                    $editTr.find(".e-editcell").first().prop("colspan", (frozenColSpan - $tempFirstTR.find("td").not(":visible").length - hideCount));

                }
                if (!$editTr.is(":last-child"))
                    $editTr.find('td.e-rowcell').addClass('e-validError');
                if (this.getBrowserDetails().browser == "msie" && this.model.editSettings.rowPosition == "bottom")
					this._colgroupRefresh();
                this._refreshUnboundTemplate($editTr.find(".gridform"));
                this._gridRows = this.getContentTable().first().find(".e-rowcell").closest("tr.e-row, tr.e-alt_row").toArray();
                if (this.model.scrollSettings.frozenColumns > 0)
                    this._gridRows = [this._gridRows, this.getContentTable().last().find(".e-rowcell").closest("tr.e-row, tr.e-alt_row").toArray()];
            }
            else if (this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate") {
                temp.innerHTML = this.model.editSettings.editMode == "inlineform" ? $.render[this._id + "_JSONDialogEditingTemplate"](args.data) : $.render[this._id + "_JSONdialogTemplateMode"](args.data);
                var hideCount = !this.model.groupSettings.showGroupedColumn ? this.model.groupSettings.groupedColumns.length : 0;
                var detailCount = 0;
                var tr = ej.buildTag('tr');
                var td = ej.buildTag('td');
                tr.addClass("e-addedrow");
                td.addClass("e-inlineformedit e-editcell");
                temp = $(temp).clone(true).children();
				var $select = $(temp).find('select.e-field');
                for (var i = 0; i < $select.length; i++)
                    $select.eq(i).val(args.data[$select[i].name]);
                td.html(temp);
                tr.append(td);
                if (!tr.is(":last-child"))
                    tr.find('.e-rowcell').addClass('e-validError');
                var hideCount = !this.model.groupSettings.showGroupedColumn ? this.model.groupSettings.groupedColumns.length : 0;
                if (this.model.groupSettings.groupedColumns.length) {
                    for (var i = 0; i < this.model.groupSettings.groupedColumns.length; i++) {
                        tr.prepend(ej.buildTag("td.e-indentcell"));
                    }
                } else
                    tr.find("td.e-editcell").prop("colspan", (this.model.columns.length - this._hiddenColumns.length - hideCount));
                if (this.model.scrollSettings.frozenColumns > 0) {
                    var $trClone = tr.clone(), $divs = td.find(".gridform").children();
                    $trClone.find("td").empty().prop("colSpan", this.model.scrollSettings.frozenColumns - this._getHiddenCount($divs.slice(0, this.model.scrollSettings.frozenColumns)));
                    td.prop("colSpan", this.model.columns.length - this.model.scrollSettings.frozenColumns - this._getHiddenCount($divs.slice(this.model.scrollSettings.frozenColumns)));
                    this.getContentTable().first().find('tbody').first().prepend($trClone);
                    this.getContentTable().last().find('tbody').first().prepend(tr);
                }
                else {
					if (this.model.detailsTemplate != null || this.model.childGrid != null)
                        detailCount++;
                    td.prop("colspan", this.model.columns.length - this._hiddenColumns.length - hideCount + detailCount);
                    if (this.model.currentViewData.length == 0 || this.getContentTable().find('td.e-rowcell').length == 0)
                        this.getContentTable().find('tr').first().replaceWith($(tr));
                    else
                        if (this.model.allowPaging && this.model.pageSettings.pageSize <= this.model.currentViewData.length && this.model.groupSettings.groupedColumns.length == 0)
                            this.getContentTable().get(0).lastChild.removeChild(this.getContentTable().get(0).lastChild.lastChild);
                    if (this.model.editSettings.rowPosition == "top")
                        this.getContentTable().first().find('tbody').first().prepend(tr);
                    else if (this.model.editSettings.rowPosition == "bottom")
                        this.getContentTable().first().find('tbody').first().append(tr);
                }
                
                if ((this.model.detailsTemplate != null || this.model.childGrid != null) && $(this.getContentTable().get(0).lastChild.lastChild).children('.e-detailrowexpand').length)
                    this.getContentTable().get(0).lastChild.removeChild(this.getContentTable().get(0).lastChild.lastChild);
                $("#" + this._id + "_inlineFormTitle").text(this.localizedLabels.AddFormTitle);
                this._refreshUnboundTemplate($("#" + this._id + "EditForm"));
                this._gridRows = this.getContentTable().first().find(".e-rowcell,.e-inlineformedit").closest("tr.e-row, tr.e-alt_row").toArray();
                if (this.model.scrollSettings.frozenColumns > 0)
                    this._gridRows = [this._gridRows, this.getContentTable().last().find(".e-rowcell").closest("tr.e-row, tr.e-alt_row").toArray()];
            }
            else {
                $(temp).addClass("e-addedrow");
                temp.innerHTML = this.model.editSettings.editMode == "dialog" || this.model.editSettings.editMode == "externalform" ? $.render[this._id + "_JSONDialogEditingTemplate"](args.data) : $.render[this._id + "_JSONdialogTemplateMode"](args.data);
                var $select = $(temp).find('select.e-field');
                for (var i = 0; i < $select.length; i++)
                    $select.eq(i).val(args.data[$select[i].name]);
                if (this.model.editSettings.editMode == "dialog" || this.model.editSettings.editMode == "dialogtemplate") {
                    $("#" + this._id + "_dialogEdit").html($(temp));
                    var model = {};
                    model.cssClass = this.model.cssClass;
                    model.width = "auto";
                    model.enableResize = this.phoneMode;
                    model.content = "#" + this._id;
                    model.enableModal = true;
                    model.close = $.proxy(this._buttonClick, this);
                    model.enableRTL = this.model.enableRTL;
                    model.allowKeyboardNavigation = false;
                    model.title = this.localizedLabels.AddFormTitle;
                    $("#" + this._id + "_dialogEdit").ejDialog(model);
                    $("#" + this._id + "_dialogEdit").ejDialog("open");
                }
                else {
                    $("#" + this._id + "_externalEdit").css("display", "block").css('z-index', this._maxZindex() + 1);
                    $("#" + this._id + "_externalForm").find(".e-externalformedit").html($(temp));
                    $("#" + this._id + "_eFormHeader").find(".e-form-title").text(this.localizedLabels.AddFormTitle);
                    this._externalFormPosition();
                }
            }
            if (this.model.editSettings.editMode != "normal")
                $editTr = $(temp);
			if(!ej.isNullOrUndefined(this.model.templateRefresh) && $editTr.find(".e-templatecell").length != 0) 
				this._refreshTemplateCell($editTr, args.data);
            if (this.model.allowPaging) {
                if (this.model.filterSettings.filteredColumns.length)
                    this.getPager().ejPager({ totalRecordsCount: this._searchCount == null ? this._filteredRecordsCount : this._searchCount, currentPage: this._currentPage() });
                else
                    this.getPager().ejPager({ totalRecordsCount: this._searchCount == null ? this._gridRecordsCount : this._searchCount, currentPage: this._currentPage() });
                this._refreshGridPager();
            }
        },
        editFormValidate: function () {
            if ($.isFunction($.validator)) {
                if (this.model.scrollSettings.frozenColumns > 0) {
                    var forms = this.element.find(".gridform");
                    if (forms.length > 1) {
                        var form1, form2;
                        form1 = forms.eq(0).validate().form();
                        form2 = forms.eq(1).validate().form();
                        if (!(form1 && form2))
                            return false;
                        else
                            return true;
                    }
                    else
                        return forms.validate().form();
                }
                else if (this.model.editSettings.showAddNewRow) {
                   return $(this.getRows()).hasClass("e-editedrow") ? this.element.find(".e-editedrow .gridform").validate().form() : this.element.find(".e-addedrow .gridform").validate().form();
                }
                return $("#" + this._id + "EditForm").validate().form();
            }
            return true;
        },
        _refreshAltRow: function () {
            var $gridRows = this._excludeDetailRows();
            for (var r = 0; r < $gridRows.length; r++) {
                var $row = $($gridRows[r]);
                $row.hasClass("e-alt_row") && $row.removeClass("e-alt_row");
                (r % 2 != 0) ? $row.addClass("e-alt_row") : $row.addClass("e-row")
            }
        },
        _editCompleteAction: function (args) {
            var $form = this.element.find(".gridform");
            this.model.isEdit = true;
            var $cols1 = this.getContentTable().children("colgroup").find("col");
            var width = this.element.width()
            this.setWidthToColumns();
            if (ej.Grid.Actions.Add == args.requestType) {
                var disabledElements = $form.find(".e-field:disabled");
                for (var j = 0; j < disabledElements.length; j++) {
                    var fieldName = $(disabledElements[j]).attr("name");
                    if (!$(disabledElements[j]).hasClass("e-identity"))
                        if ($.inArray(fieldName, this._disabledEditableColumns) == -1 || $.inArray(fieldName, this._primaryKeys) !== -1)
                            $(disabledElements[j]).removeAttr("disabled").removeClass("e-disable");
                }
                for (var i = 0; i < this.model.groupSettings.groupedColumns.length - 1; i++)
                    $form.find("colgroup").prepend(this._getIndentCol());
            }
            if (this._tdsOffsetWidth.length == 0 || this.model.groupSettings.groupedColumns.length || $.inArray(0, this._tdsOffsetWidth) != -1 || this._hiddenColumns.length > 0)
                this._setoffsetWidth();
            this._refreshEditForm(args);
            if (this.model.scrollSettings.frozenColumns > 0 && (this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate")) {
                if (args.requestType == "beginedit")
                    args.row.eq(0).next().find("td").height(args.row.eq(1).next().find("td").height());
                else
                    this.getContentTable().first().find("tr").first().find("td").height(this.getContentTable().last().find("tr").first().find("td").height());
            }
            if (this.model.scrollSettings.frozenRows > 0 && args.requestType == "beginedit")
                this._initFrozenRows();
            if (this.model.scrollSettings.frozenColumns > 0)
                this.rowHeightRefresh();
            if (this.model.allowScrolling && this.model.scrollSettings.frozenColumns <= 0 && this.getScrollObject()
                && this.getScrollObject().isHScroll())
                this.getScrollObject().refresh();
            if ($.isFunction($.validator))
                this.initValidator();
        },
        _refreshEditForm: function (args) {
			var editedTr; 
			if(this.model.editSettings.showAddNewRow)
				editedTr = this.getContentTable().find(".e-editedrow");
            var form = this.model.scrollSettings.frozenColumns > 0 ? this.element.find(".gridform") : !ej.isNullOrUndefined(editedTr) && editedTr.length == 1 ? editedTr[0].lastChild.lastChild : document.getElementById(this._id + "EditForm");
            var elementFocused = false, columnIndex, matchMedia;
            if (this.model.enableResponsiveRow && $.isFunction(window.matchMedia))
                matchMedia = window.matchMedia("(max-width: 320px)");
            var $formElement = $(form).find("input,select,div.e-field,textarea"), percent = 86;
            if ((this._isUnboundColumn || this.getContentTable().find(".e-templatecell") != null) && this.model.editSettings.editMode != "batch")
                $formElement = $formElement.filter(function () { return (!$(this).closest(".e-rowcell").hasClass("e-unboundcell") && !$(this).closest(".e-rowcell").hasClass("e-templatecell")) })
            for (var i = 0; i < $formElement.length; i++) {
                var $element = $formElement.eq(i);
                var inputWidth, column = this.getColumnByField(!ej.isNullOrUndefined($element.prop("name")) ? $element.prop("name") : $element.attr("name"));
                if (column != null)
                    columnIndex = $.inArray(column, this.model.columns);
                if (this.model.editSettings.editMode == "batch") {
                    percent = 95;
                }
                else if (this.model.editSettings.editMode == "normal")
                    percent = 96;
                if (this.model.editSettings.editMode == "externalform" || this.model.editSettings.editMode == "externalformtemplate" || this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate") {
                    $element.parent().css("width", ej.dataUtil.max(this._tdsOffsetWidth) + "px");
                    inputWidth = ej.max(this._tdsOffsetWidth) * (percent / 100);
                }
                else
                    inputWidth = this._tdsOffsetWidth[i] * (percent / 100);
                if ((this.model.editSettings.editMode == "normal" || this.model.editSettings.editMode == "batch" || this.model.allowResizing || this.model.allowResizeToFit) && !$element.hasClass("e-checkbox"))
                    inputWidth = "100%";
                if (column !=null && columnIndex !== undefined && (columnIndex < this.model.columns.length && this.model.columns[columnIndex].editTemplate)) {
                    var temp = { rowdata: this.model.editSettings.editMode == "batch" ? this._batchEditRowData : this._currentJsonData[this._selectedRow()], column: this.model.columns, element: $element, requestType: args.requestType, type: args.type };
                    var temp1 = this.model.columns[columnIndex].editTemplate.write;
                    if (!ej.isNullOrUndefined(args) && args.requestType == "add") temp.rowdata = {};
                    if (typeof temp1 == "string")
                        temp1 = ej.util.getObject(temp1, window);
                    temp1(temp);
					if(this.model.columns[columnIndex].isPrimaryKey && args.requestType == "beginedit")
						$element.addClass("e-disable").attr("disabled", "disabled");
                }
                else if ($element.hasClass("e-numerictextbox")) {
                    var params = { width: inputWidth }, value = $element.val(), customParams = this.getColumnByField($element.prop("name"));
                    if ((!ej.isNullOrUndefined(matchMedia) && matchMedia.matches) || customParams["width"] && typeof customParams["width"] == "string" && customParams["width"].indexOf("%") != -1 && (this.model.editSettings.editMode == "normal" || this.model.editSettings.editMode == "batch"))
                        params.width = "100%";
                    params.enableRTL = this.model.enableRTL;
                    params.showSpinButton = true;
                    params.cssClass = this.model.cssClass;
                    params.watermarkText = this.localizedLabels.NumericTextBoxWaterMark;
					params.locale = this.model.locale;
                    if (value.length)
                        params.value = parseFloat(value);
                    if ($element.hasClass("e-disable"))
                        params.enabled = false;
                    if (!ej.isNullOrUndefined(customParams["editParams"]))
                        $.extend(params, customParams["editParams"]);
                    $element.ejNumericTextbox(params);
                    $element.prop("name", $element.prop("name").replace(this._id, ""));
                } else if ($element.hasClass("e-datepicker")) {
                    var params = { width: inputWidth }, column = this.getColumnByField($element.prop("name"));
                    if ((!ej.isNullOrUndefined(matchMedia) && matchMedia.matches) || column["width"] && typeof column["width"] == "string" && column["width"].indexOf("%") != -1 && (this.model.editSettings.editMode == "normal" || this.model.editSettings.editMode == "batch"))
                        params.width = "100%";
                    params.enableRTL = this.model.enableRTL;
                    params.cssClass = this.model.cssClass;
                    params.displayDefaultDate = true;
                    params.showPopupButton = false;
                    params.watermarkText = this.localizedLabels.DatePickerWaterMark;
					params.locale = this.model.locale;
                    if ($element.val().length)
                        params.value = new Date($element.val());
                    if ($element.hasClass("e-disable"))
                        params.enabled = false;
                    if (column["format"] !== undefined && column.format.length > 0) {
                        var toformat = new RegExp("\\{0(:([^\\}]+))?\\}", "gm");
                        var formatVal = toformat.exec(column.format);
                        params.dateFormat = formatVal[2];
                    }
                    if (!ej.isNullOrUndefined(column["editParams"]))
                        $.extend(params, column["editParams"]);
                    $element.ejDatePicker(params);
					if(this.model.editSettings.editMode == "batch")
                        $element.ejDatePicker("show");
				}
                else if ($element.hasClass("e-datetimepicker")) {
                    var column = this.getColumnByField($element.prop("name")),
                        params = {
                            width: inputWidth,
                            enableRTL: this.model.enableRTL,
                            cssClass: this.model.cssClass,
                            showPopupButton: false,
							locale : this.model.locale
                        };
                    if ((!ej.isNullOrUndefined(matchMedia) && matchMedia.matches) || column["width"] && typeof column["width"] == "string" && column["width"].indexOf("%") != -1 && (this.model.editSettings.editMode == "normal" || this.model.editSettings.editMode == "batch"))
                        params.width = "100%";
                    if ($element.val().length)
                        params.value = new Date($element.val());
                    if ($element.hasClass("e-disable"))
                        params.enabled = false;
                    if (column["format"] !== undefined && column.format.length > 0) {
                        var toformat = new RegExp("\\{0(:([^\\}]+))?\\}", "gm");
                        var formatVal = toformat.exec(column.format);
                        params.dateTimeFormat = formatVal[2];
                    }
                    if (!ej.isNullOrUndefined(column["editParams"]))
                        $.extend(params, column["editParams"]);
                    $element.ejDateTimePicker(params);
					if(this.model.editSettings.editMode == "batch")
                        $element.ejDateTimePicker("show");
                }
                else if ($element.hasClass("e-dropdownlist")) {
                    var f_index = -1;
                    if (this._dataSource().adaptor instanceof ej.ForeignKeyAdaptor)
                        f_index = this._dataSource().adaptor.value.indexOf(column.field);
                    var column = this.getColumnByField($element.prop("name")),
                        params = {
                            width: inputWidth,
                            enableRTL: this.model.enableRTL,
                            enableIncrementalSearch: true
                        };
                    if ((!ej.isNullOrUndefined(matchMedia) && matchMedia.matches) || column["width"] && typeof column["width"] == "string" && column["width"].indexOf("%") != -1 && (this.model.editSettings.editMode == "normal" || this.model.editSettings.editMode == "batch"))
                        params.width = "100%";
                    if (!ej.isNullOrUndefined(column["editParams"]))
                        $.extend(params, column["editParams"]);
                    if (!ej.isNullOrUndefined(column.dataSource) && !ej.isNullOrUndefined(column.editParams) && ej.isNullOrUndefined(column.foreignKeyField) && this._dataSource().adaptor instanceof ej.ForeignKeyAdaptor && f_index != -1)
                        params.dataSource = column.dataSource;
                    else if (ej.isNullOrUndefined(column.dataSource) && f_index != -1 && !ej.isNullOrUndefined(column.editParams))
                        params.dataSource = this._dataSource().adaptor.foreignData[f_index];
                    $element.ejDropDownList(params);
                    if ((this._dataSource() instanceof ej.DataManager && this._dataSource().adaptor instanceof ej.ForeignKeyAdaptor) && f_index != -1 && !ej.isNullOrUndefined(column.editParams))
                        $element.ejDropDownList("setSelectedText", args.requestType == "add" && ej.isNullOrUndefined(column.defaultValue) ? $element.val("") : $element.val());
                    else
                        $element.ejDropDownList("setSelectedValue", args.requestType == "add" && ej.isNullOrUndefined(column.defaultValue) ? $element.val("") : $element.val());
                    if ($element.hasClass("e-disable"))
                        $element.ejDropDownList("disable");
                }
				 else if ($element.hasClass("e-save e-button") || $element.hasClass("e-cancel e-button") )
					 $element.ejButton({ cssClass: this.model.cssClass, enableRTL: this.model.enableRTL, width: "100","text-align":"centre",height:"35px"});
                    //else if ($element.hasClass("checkbox"))
                    //{
                    //    var value = $element.prop("checked");
                    //    $element.ejCheckBox({
                    //        id: $element[0].id,
                    //        checked: value
                    //    });
                    //}
                else {
                    switch ($element.prop('tagName')) {
                        case "INPUT":
                            if (!ej.isNullOrUndefined(column) && column.format && $element.val() != "") {
                                switch (column.type) {
                                    case ("date" || "datetime"):
                                        var value = $element.val();
                                        var date = new Date(value);
                                        var format = column.format.replace("{0:", "").replace("}", "");
                                        var newformat = ej.format(date, format);
                                        $element.val(newformat);
                                        break;
                                    case "number":
                                        var value = $element.val();
                                        var format = new RegExp("\\{0(:([^\\}]+))?\\}", "gm").exec(column.format);
                                        format[2].toLowerCase().split("")[0] == "c" ? format[2] = format[2].toLowerCase().replace("c", "n") : format[2];
                                        $element.val(ej.format(parseFloat(value), format[2]));
                                        break;
                                }
                            }
                            if ($element.attr("type") != "checkbox") {
                                $element.css("text-align", $element.attr("name") != null && this.getColumnByField($element.attr("name")) != null ?
                                this.getColumnByField($element.attr("name")).textAlign : "center");
                                if (this.model.editSettings.editMode == "batch"){
                                    $element.css('width', '100%').css("height", "28px");
									if (ej.browserInfo().name == "msie" && parseInt(ej.browserInfo().version, 10) == 8)
									   $element.css("line-height", "22px");
							    }
                                else if (this.model.editSettings.editMode == "normal"){
                                    $element.css('width', '100%').css("height", "30px");
									if (ej.browserInfo().name == "msie" && parseInt(ej.browserInfo().version, 10) == 8)
									   $element.css("line-height", "24px");
								}	
                                else{
                                    $element.outerWidth(inputWidth).height(28);
									if (ej.browserInfo().name == "msie" && parseInt(ej.browserInfo().version, 10) == 8)
									   $element.css("line-height", "26px");
								}

                            }
                            else
                                $element.width(inputWidth > 0 ? ($element.width() > inputWidth ? inputWidth : $element.width()) : this.model.editSettings.editMode.indexOf("template") != -1 ? $element.width() : 1);
								if(this.model.editSettings.editMode == "batch" && !this._tabKey)
									$element.is(':checked') ? $element.prop("checked",false) : $element.prop("checked",true);
                            break;
                        case "SELECT":
                            $element.width(inputWidth).height(28);
                            break;
                    }
                }
                if (column != null && !column.visible && column.validationRules && !(this.model.editSettings.editMode == "dialogtemplate" || this.model.editSettings.editMode == "externalformtemplate" || this.model.editSettings.editMode == "inlineformtemplate")){
					if(column.editType == ej.Grid.EditingType.Dropdown)
						$element.closest(".e-rowcell").find("input").addClass("e-hide");					
					$element.addClass("e-hide");
				}
                if (!$element.is(":disabled") && !elementFocused && (!$element.is(":hidden") || typeof ($element.data("ejDropDownList") || $element.data("ejNumericTextbox")) == "object")) {
                    this._focusElements($element);
                    elementFocused = true;
                }
            }

        },
        _focusElements: function ($currentCell) {
            if ($currentCell.length) {
                var $childElem = $currentCell;
                if (($childElem[0].tagName.toLowerCase() == "select" && !$childElem.hasClass("e-field e-dropdownlist")) || ($childElem[0].tagName.toLowerCase() == "input") && !$childElem.hasClass("e-numerictextbox")) {
                    $childElem.focus().select();
                    $childElem[0].focus();
                }
                else if ($childElem.hasClass("e-field e-dropdownlist"))
                     $childElem.closest(".e-ddl").focus();
				else if ($childElem.hasClass('e-numerictextbox'))
					 $childElem.siblings('input:visible').first().select().focus();
                else
                    $childElem.find('input:visible,select').first().select().focus();
            }
        },
        _renderToolBar: function () {
            var $div = ej.buildTag('div.e-gridtoolbar', "", {}, { id: this._id + "_toolbarItems" });
            var $ul = ej.buildTag("ul");
            ((!ej.isNullOrUndefined(this.model.toolbarSettings.toolbarItems) && this.model.toolbarSettings.toolbarItems.length) || ((this.model.allowSorting || this.model.allowFiltering) && this.model.enableResponsiveRow)) && this._renderLi($ul);
            $div.append($ul);
            var $customUl = ej.buildTag("ul");
            $div.append($customUl);
            (!ej.isNullOrUndefined(this.model.toolbarSettings.customToolbarItems) && this.model.toolbarSettings.customToolbarItems.length) && this._renderCustomLi($customUl);
            var model = {};
            model.click = this._toolBarClick;
            model.cssClass = this.model.cssClass;
            model.enableRTL = this.model.enableRTL;
            model.enableSeprator = false;
            $div.ejToolbar(model);
            $div.ejToolbar("disableItem", this._disabledToolItems);
            this._disabledToolItems = $();
            return $div;
        },
        _renderCustomLi: function ($ul) {
            var $li; var customToolbar;
            for (var i = 0; i < this.model.toolbarSettings.customToolbarItems.length; i++) {
                customToolbar = this.model.toolbarSettings.customToolbarItems[i]["templateID"] ? this.model.toolbarSettings.customToolbarItems[i]["templateID"].replace("#", "") : this.model.toolbarSettings.customToolbarItems[i];
                $li = ej.buildTag("li", "", {}, { id: this._id + "_" + customToolbar, title: customToolbar });
                switch (typeof this.model.toolbarSettings.customToolbarItems[i]) {
                    case "string":
                        var $item = ej.buildTag("a.e-toolbaricons e-icon", "", {}).addClass(this.model.toolbarSettings.customToolbarItems[i]);
                        break;
                    case "object":
                        $li.attr("title", this.model.toolbarSettings.customToolbarItems[i]["templateID"].replace("#", ""));
                        var $item = $(this.model.toolbarSettings.customToolbarItems[i]["templateID"]).hide().html();
                        break;
                }
                $li.html($item);
                $ul.append($li);
            }
        },
        _renderLi: function ($ul) {
            if ($.isFunction(window.matchMedia)) {
                if (this.model.enableResponsiveRow && window.matchMedia("(max-width: 320px)").matches) {
                    var searchIndex = this.model.toolbarSettings.toolbarItems.indexOf('search');
                    searchIndex != -1 && this.model.toolbarSettings.toolbarItems.splice(searchIndex, 1);
                    if (this.model.allowFiltering)
                        this.model.toolbarSettings.toolbarItems.push('responsiveFilter');
                    if (this.model.allowSorting) {
                        this.model.toolbarSettings.toolbarItems.push('responsiveSorting');
                    }
                    searchIndex != -1 && this.model.toolbarSettings.toolbarItems.push('search');
                }
            }
            for (var i = 0; i < this.model.toolbarSettings.toolbarItems.length; i++) {
                var $li = ej.buildTag("li", "", {}, { id: this._id + "_" + this.model.toolbarSettings.toolbarItems[i], title: this.localizedLabels[this.model.toolbarSettings.toolbarItems[i].slice(0, 1).toUpperCase() + this.model.toolbarSettings.toolbarItems[i].slice(1)] });
                this._renderLiContent($li, this.model.toolbarSettings.toolbarItems[i]);
                $ul.append($li);
            }
        },
        _renderLiContent: function ($li, item) {
            var $a, $input, $div, $span;
            switch (item) {
                case "add":
                    $a = ej.buildTag("a.e-addnewitem e-toolbaricons e-icon e-addnew", "", {});
                    break;
                case "edit":
                    $a = ej.buildTag("a.e-edititem e-toolbaricons e-icon e-edit", "", {});
                    break;
                case "delete":
                    $a = ej.buildTag("a.e-deleteitem e-toolbaricons e-icon e-delete", "", {});
                    break;
                case "update":
                    $a = ej.buildTag("a.e-saveitem e-toolbaricons e-disabletool e-icon e-save", "", {});
                    this._disabledToolItems.push($li.get(0));
                    break;
                case "cancel":
                    $a = ej.buildTag("a.e-cancel e-toolbaricons e-disabletool e-icon e-gcancel", "", {});
                    this._disabledToolItems.push($li.get(0));
                    break;
				
                case "search":
                    $a = ej.buildTag("a.e-searchitem e-toolbaricons e-disabletool e-icon e-searchfind", "", {});
                    if (!this.model.enableResponsiveRow) {
                        $input = ej.buildTag("input.e-ejinputtext", "", {}, { type: "text", id: this._id + "_searchbar" });
                        $span = ej.buildTag('span.e-cancel e-icon e-hide', "", { 'right': '1%' });
                        $div = ej.buildTag('div.e-filterdiv e-searchinputdiv', "", { 'display': 'inline-table', 'width': '83%' });
                        $div.append($input).append($span);
                        $li.append($div);
                        if (!ej.isNullOrUndefined(this.model.searchSettings.key))
                            $input.val(this.model.searchSettings.key);
                    }
                    this.model.allowSearching = true;
                    break;
				case "printGrid":
					 $a = ej.buildTag("a.e-print e-toolbaricons e-icon", "", {});
					 break;
                case "excelExport":
                    $a = ej.buildTag("a.e-toolbaricons e-excelIcon e-icon", "", {});
                    break;
                case "wordExport":
                    $a = ej.buildTag("a.e-toolbaricons e-wordIcon e-icon", "", {});
                    break;
                case "pdfExport":
                    $a = ej.buildTag("a.e-toolbaricons e-pdfIcon e-icon", "", {});
                    break;
                case "responsiveFilter":
                    $a = ej.buildTag("a.e-toolbaricons e-filterset e-icon", "", {});
                    break;
                case "responsiveSorting":
                    $a = ej.buildTag("a.e-toolbaricons e-respponsiveSorting e-icon", "", {});
                    break;
            }
            $li.append($a);
            if (item == "search"){
                this._searchBar = $li;
				$li.css('display','flex');
			}
        },
        _toolBarClick: function (Sender) {
            var $gridEle = $(this.itemsContainer).closest(".e-grid"), gridInstance = $gridEle.ejGrid("instance"), gridId = $gridEle.attr('id');
            if (Sender.event == undefined && Sender.target.tagName == "INPUT" && Sender.currentTarget.id == gridId + "_search")
                return;
            $.isFunction($.fn.ejDatePicker) && $("#" + gridId + "EditForm").find(".e-datepicker").ejDatePicker("hide");
            var currentTarget = Sender.currentTarget; var target = Sender.target;
            var args = { itemName: currentTarget.title, itemId: currentTarget.id, currentTarget: currentTarget, target: target, itemIndex: $(currentTarget).index(), itemCurrentTarget: currentTarget.outerHTML, gridModel:gridInstance.model, itemTarget: target.outerHTML, toolbarData: Sender };
            if ($gridEle.ejGrid("instance")._trigger("toolbarClick", args))
                return;
            switch (args.itemId) {
                case gridId + "_add":
                    gridInstance._toolbarOperation(gridId + "_add");
                    break;
                case gridId + "_edit":
                    gridInstance._toolbarOperation(gridId + "_edit");
                    break;
                case gridId + "_delete":
                    gridInstance._toolbarOperation(gridId + "_delete");
                    break;
                case gridId + "_update":
                    gridInstance._toolbarOperation(gridId + "_update");
                    break;
                case gridId + "_cancel":
                    if (gridInstance.model.editSettings.editMode == "batch")
                        gridInstance._confirmDialog.find(".e-content").html(gridInstance.localizedLabels.CancelEdit).end().ejDialog("open");
                    else
                        gridInstance._toolbarOperation(gridId + "_cancel");
                    break;
                case gridId + "_search":
                    if (gridInstance.model.enableResponsiveRow) {
                        if (ej.isNullOrUndefined(gridInstance.element.find('.e-responsesearch')[0])) {
                            var $div = ej.buildTag('div.e-gridtoolbar', "", {}, { id: this._id + "_toolbarItems" });
                            var $ul = ej.buildTag('div.e-responsesearch', '', { 'width': '95%', 'height': '38px', 'margin-top': '7px', 'margin-left': '6px' });
                            var $span = ej.buildTag('span.e-ttoltxt', '', { width: '98%', 'margin-left': '2%' }, { id: gridInstance._id + "_search" });
							$a = ej.buildTag("span.e-searchitem e-toolbaricons e-disabletool e-icon e-searchfind", "", { 'position': 'absolute', 'right': '2%', 'margin-top': '1%' });
                            if (ej.browserInfo().name === "webkit")
                                $a.css("margin-top", "-2px");
                            var $input = ej.buildTag("input.e-ejinputtext", "", { width: '97%', 'height': '30px' }, { type: "search", id: gridInstance._id + "_searchInput" });
                            if (!ej.isNullOrUndefined(gridInstance.model.searchSettings.key))
                                $input.val(gridInstance.model.searchSettings.key);
                            $span.append($input);
                            $span.append($a);
                            $ul.append($span);
                            $div.append($ul);
                            $div.ejToolbar({
                                click: function (sender) {
                                    gridInstance._toolbarOperation(gridId + "_search", $(sender.currentTarget).find("input").val());
                                }
                            });
                            $input.bind('keyup', function (e) {
                                if ($input.val() != '') {
                                    $a.removeClass('e-searchfind');
                                    $a.addClass('e-cancel')
                                }
                                else {
                                    $a.removeClass('e-cancel');
                                    $a.addClass('e-searchfind');
                                }
                            });
                            $a.click(function () {
                                if ($a.hasClass('e-cancel')) {
                                    $input.val('');
                                    $a.removeClass('e-cancel');
                                    $a.addClass('e-searchfind');
                                    gridInstance._toolbarOperation(gridId + "_search", $("#" + gridId + "_searchInput").val());
                                }
                            })
                            $div.insertBefore(gridInstance.getHeaderContent());
                        }
                        else {
                            if (gridInstance.element.find('.e-responsesearch').css('display') == 'block')
                                gridInstance.element.find('.e-responsesearch').css('display', 'none');
                            else
                                gridInstance.element.find('.e-responsesearch').css('display', 'block');
                        }
                    }
                    else
                        gridInstance._toolbarOperation(gridId + "_search", $(Sender.currentTarget).find("input").val());
                    break;
				case gridId + "_printGrid":
                    gridInstance._toolbarOperation(gridId + "_printGrid");
                    break;
                case gridId + "_excelExport":
                    gridInstance._toolbarOperation(gridId + "_excelExport");
                    break;
                case gridId + "_wordExport":
                    gridInstance._toolbarOperation(gridId + "_wordExport");
                    break;
                case gridId + "_pdfExport":
                    gridInstance._toolbarOperation(gridId + "_pdfExport");
                    break;
                case gridId + "_responsiveFilter":
                    gridInstance._toolbarOperation(gridId + "_responsiveFilter");
                    break;
                case gridId + "_responsiveSorting":
                    gridInstance._toolbarOperation(gridId + "_responsiveSorting");
                    break;
            }
            return false;
        },

        _toolbarOperation: function (operation, searchEle) {
            var $gridEle = this.element, gridObject = $gridEle.ejGrid("instance"), batchEnable = gridObject.model.editSettings.editMode == "batch", gridId = $gridEle.attr('id'), fieldName;
            gridObject._exportTo = gridObject["export"];
            switch (operation) {
                case gridId + "_add":
                    if (batchEnable)
                        gridObject._bulkAddRow();
                    else
                        gridObject._startAdd();
                    break;
                case gridId + "_edit":
                    if (batchEnable && gridObject.model.editSettings.allowEditing) {
					    if (gridObject._bulkEditCellDetails.columnIndex == -1) {
					        alert(this.localizedLabels.EditOperationAlert);
                            return;
                        }
                        fieldName = gridObject.model.columns[gridObject._bulkEditCellDetails.columnIndex].field;
                        fieldName && gridObject.editCell(gridObject._bulkEditCellDetails.rowIndex, fieldName);
                    }
                    else
                        gridObject.startEdit();
                    break;
                case gridId + "_delete":
                    if (this._selectedRow() == -1) {
                        alert(this.localizedLabels.DeleteOperationAlert);
                        return;
                    }
                    if (this.model.editSettings.showDeleteConfirmDialog)
                        this._confirmDialog.find(".e-content").html(this.localizedLabels.ConfirmDelete).end().ejDialog("open");
                    else {
                        if (batchEnable)
                            this._bulkDelete()
                        else {
                            if (this.multiDeleteMode)
                                this._multiRowDelete();
                            else
                                this.deleteRow();
                        }
                    }
                    break;
                case gridId + "_update":
                    if (batchEnable && $("#" + this._id + "EditForm").children().find(".e-field-validation-error").length == 0)
                        this.model.editSettings.showConfirmDialog ? this._confirmDialog.find(".e-content").html(this.localizedLabels.BatchSaveConfirm).end().ejDialog("open") : this.batchSave();
                    else
                        gridObject.endEdit();
                    break;
                case gridId + "_cancel":
                    if (batchEnable) {
                        if ($("#" + gridId + "ConfirmDialog").ejDialog("isOpened") === true)
                            this._triggerConfirm();
                        else
                            gridObject.cancelEditCell();
                    }
                    else
                        gridObject.cancelEdit();
                    break;
                case gridId + "_search":
                    if (args.type == 'click' && args.target.nodeName == "A")
                        $gridEle.ejGrid("search", searchEle);
                    break;
				case gridId + "_printGrid":
                    this.print();
                    break;
                case gridId + "_excelExport":
                    gridObject._exportTo(gridObject.model.exportToExcelAction, 'excelExporting', gridObject.model.allowMultipleExporting);
                    break;
                case gridId + "_wordExport":
                    gridObject._exportTo(gridObject.model.exportToWordAction, 'wordExporting', gridObject.model.allowMultipleExporting);
                    break;
                case gridId + "_pdfExport":
                    gridObject._exportTo(gridObject.model.exportToPdfAction, 'pdfExporting', gridObject.model.allowMultipleExporting);
                    break;
                case gridId + "_responsiveFilter":
                    $("#responsiveFilter").css('display', 'block');
                    setTimeout(function () { gridObject.element.css('display', 'none'), 0 });
                    break;
                case gridId + "_responsiveSorting":
                    this._sortColumns = []; this._removeSortCol = []
                    for (var i = 0; i < this.model.sortSettings.sortedColumns.length; i++) {
                        this._sortColumns.push({ field: this.model.sortSettings.sortedColumns[i].field, direction: this.model.sortSettings.sortedColumns[i].direction });
                    }
                    if (ej.isNullOrUndefined($("#responsiveSort")[0])) {
                        var $dlg = $("#responsiveFilter").clone().css('display', 'block');
                        $dlg.insertAfter(this.element);
                        $dlg.attr('id', 'responsiveSort');
                        gridObject._setSortingButton();
                        var $btnDiv = ej.buildTag('div.btnContainer', '', { width: '100%', 'bottom': '0px', 'position': 'absolute' });
                        var $inputOk = ej.buildTag('input.e-resposnsiveFilterBtnLeft', 'OK', { 'width': '45.6%' });
                        var $inputCancel = ej.buildTag('input.e-resposnsiveFilterBtnRight', 'Cancel', { 'width': '46%' });
                        var $closeIcon = ej.buildTag('div.e-resFIlterRigthIcon');
                        var $cspanIcon = ej.buildTag('span.e-icon e-responsiveClose e-resIcon');
                        $dlg.find('.e-resFilterleftIcon').remove();
                        $dlg.find('.labelRes').text('Sorting');
                        $dlg.find('.e-resFilterDialogHeaderDiv').append($closeIcon.append($cspanIcon))
                        $dlg.find('.e-resFilterDialogHeaderDiv').find('.e-resFIlterRigthIcon').click(function (e) {
                            $("#responsiveSort").css('display', 'none');
                            gridObject.element.css('display', 'block');
                        })
                        var $divIcon = ej.buildTag('div.e-resFilterleftIcon', '', { 'margin-top': '3%' });
                        var $spanIcon = ej.buildTag('span.e-icon e-resIcon e-responsiveSortClear');
                        $divIcon.click(function () {
                            $dlg.find('.e-responsivefilterColDiv').find('.e-button').remove();
                            gridObject._setSortingButton(true);
                            for (var i = 0; i < gridObject._sortColumns.length; i++) {
                                if (gridObject._removeSortCol.indexOf(gridObject._sortColumns[i].field) == -1)
                                    gridObject._removeSortCol.push(gridObject._sortColumns[i].field);
                            }
                            gridObject._sortColumns = [];
							gridObject._removeSortCol = [];
                        });
                        $dlg.find('.e-resFilterDialogHeaderDiv').prepend($divIcon.append($spanIcon));
                        $dlg.append($btnDiv);
                        $btnDiv.append($inputOk).append($inputCancel);
                        $inputOk.ejButton({
                            text: 'OK', type: 'button',
                            click: $.proxy(this._resSortOperation, this)
                        })
                        $inputCancel.ejButton({
                            text: 'Cancel', type: 'button',
                            click: function () {
                                $("#responsiveSort").css('display', 'none');
                                gridObject.element.css('display', 'block');
                                gridObject._sortColumns = [];
                                $dlg.find('.e-responsivefilterColDiv').find('.e-button').remove();
                                gridObject._setSortingButton();
                            }
                        })
                    }
                    else {
                        $("#responsiveSort").find('.e-responsivefilterColDiv').find('.e-button').remove();
                        this._setSortingButton();
                    }
                    $("#responsiveSort").find('.e-responsivefilterColDiv').find('.e-filternone').remove();
                    $("#responsiveSort").css('display', 'block');
                    setTimeout(function () { gridObject.element.css('display', 'none'), 0 });
                    break;
            }
            return false;
        },
        _resSortOperation: function (sender) {
            var rCol=[];
			for(var i=0; i< this.model.sortSettings.sortedColumns.length;i++)
				rCol.push(this.model.sortSettings.sortedColumns[i].field);
            for (var i = 0; i < rCol.length; i++)
                this.removeSortedColumns(rCol[i]);
            for (var i = 0 ; i < this._sortColumns.length; i++) {
                if (this.model.allowMultiSorting)
                    this.multiSortRequest = true;
                this.sortColumn(this._sortColumns[i].field, this._sortColumns[i].direction);
            }
            $("#responsiveSort").css('display', 'none');
            this.element.css('display', 'block');
        },
        _setSortingButton: function (clear) {
            var $sortDiv = $("#responsiveSort");
            var gridObj = this;
            this._sortCols = [];
            if (ej.isNullOrUndefined($sortDiv.find('.e-responsivefilterColDiv').find('.e-button')[0])) {
                $sortDiv.find('.e-responsivefilterColDiv').each(function (index, object) {
                    var $btnDiv = ej.buildTag('div', '', { 'float': 'right', 'margin-right': '2%', 'margin-top': '-1%' })
                    var fieldName = $(object).attr('ej-MappingName');
                    var $but = ej.buildTag('button#' + fieldName + ".e-sortingBtn", '');
                    $(object).append($btnDiv.append($but));
                    var btnText = 'None', icon = '';
                    if (!clear) {
                        for (var sortC = 0; sortC < gridObj.model.sortSettings.sortedColumns.length; sortC++) {
                            if (gridObj.model.sortSettings.sortedColumns[sortC].field == fieldName) {
                                btnText = gridObj.model.sortSettings.sortedColumns[sortC].direction == 'ascending' ? 'Ascending' : 'Descending';
                                icon = btnText == 'Ascending' ? 'e-resIcon e-respponsiveSortingAsc' : 'e-resIcon e-respponsiveSortingDesc';
                            }
                        }
                        if (icon != '') {
                            $but.ejButton({
                                text: btnText, type: 'button',
                                height: 28,
                                width: 120,
                                cssClass: 'e-resSortIconBtn',
                                id: fieldName,
                                prefixIcon: icon,
                                imagePosition: "imageright",
                                contentType: "textandimage",
                                showRoundedCorner: true,
                                click: $.proxy(gridObj._resSortButClick, gridObj)
                            })
                        }
                        else {
                            $but.ejButton({
                                text: btnText, type: 'button',
                                height: 28,
                                cssClass: 'e-resSortIconBtn',
                                width: 120,
                                id: fieldName,
                                showRoundedCorner: true,
                                click: $.proxy(gridObj._resSortButClick, gridObj)
                            })
                        }
                    }
                    else {
                        $but.ejButton({
                            text: btnText, type: 'button',
                            height: 28,
                            width: 120,
                            id: fieldName,
                            showRoundedCorner: true,
                            click: $.proxy(gridObj._resSortButClick, gridObj)
                        })
                    }
                });
            }
        },
        _sortOperation: function (field, direction) {
            if (this._removeSortCol.indexOf(field) != -1) {
                this._sortColumns.splice(this._removeSortCol.indexOf(field), 0);
				this._removeSortCol.splice(this._removeSortCol.indexOf(field), 0);
            }
            for (var column = 0; column < this._sortColumns.length; column++) {
                if (this._sortColumns[column]["field"] == field)
                    break;
            }
            if (this.model.allowMultiSorting) {
                this.multiSortRequest = true;
                if (column != -1) {
                    this._sortColumns.splice(column, 1);
					if (this._removeSortCol.indexOf(field) == -1)
						this._removeSortCol.push(field);
                }
            }
            else {
                $("#responsiveFilter").find('.e-responsivefilterColDiv').find('.e-button').removeClass('e-disable');
                var $divColg = $("#responsiveFilter").find('.e-responsivefilterColDiv').not(".e-responsivefilterColDiv[ej-mappingname='" + field + "']");
                var $btn = $divColg.find('.e-button').addClass('e-disable');
                $btn.text('None');
                if (this._sortColumns.length > 0) {
                    this._removeSortCol.push(this._sortColumns[0].field);
                    this._sortColumns = [];
                }
            }
            this._sortColumns.push({ field: field, direction: direction });
        },
        _resSortButClick: function (sender) {
            var text = '', prefixIcon = '', fieldName = sender.model.id;
            var obj = $("#" + sender.model.id).ejButton('instance');
            if (sender.model.text == 'None') {
                text = 'Ascending';
                prefixIcon = 'e-resIcon e-respponsiveSortingAsc';
                this._sortOperation(fieldName, 'ascending');
            }
            else if (sender.model.text == 'Ascending') {
                text = 'Descending';
                prefixIcon = 'e-resIcon e-respponsiveSortingDesc';
                this._sortOperation(fieldName, 'descending');
            }
            else {
                obj.model.text = 'None';
                obj.model.prefixIcon = '';
                obj.type = 'button';
                obj.model.contentType = "text";
                obj._render();
                for (var column = 0; column < this._sortColumns.length; column++) {
                    if (this._sortColumns[column]["field"] == fieldName)
                        break;
                }
                this._removeSortCol.push(fieldName);
                this._sortColumns.splice(column, 1);
                $("#responsiveFilter").find('.e-responsivefilterColDiv').find('.e-button').removeClass('e-disable');
                return;
            }
            obj.model.text = text; obj.model.prefixIcon = 'e-resIcon ' + prefixIcon; obj.model.imagePosition = "imageright";
            obj.model.contentType = "textandimage"; obj._render();
        },
        renderDiaglogButton: function (form, tbody) {
            var btnId;
            if (this.model.editSettings.editMode == "externalform" || this.model.editSettings.editMode == "externalformtemplate")
                btnId = "EditExternalForm_";
            else if (this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate") {
                btnId = "InlineEditForm_";
                var inlineTitleBar = ej.buildTag("div", "", "", { id: this._id + "_inlineFormTitle", 'class': "e-inlineform-titlebar" });
                inlineTitleBar.appendTo(tbody);
                    }
					
            else
                btnId = "EditDialog_";
            var savebtn = ej.buildTag('input.e-save', "", { 'margin-left': '30px' }, { type: "button", id: btnId + this._id + "_Save" });
            savebtn.ejButton({ cssClass: this.model.cssClass, enableRTL: this.model.enableRTL, text: this.localizedLabels.SaveButton, width: "100" });
            var cancelbtn = ej.buildTag('input.e-cancel', "", { 'margin-left': '19px', 'margin-right': '13px' }, { type: "button", id: btnId + this._id + "_Cancel" });
            cancelbtn.ejButton({ cssClass: this.model.cssClass, enableRTL: this.model.enableRTL, text: this.localizedLabels.CancelButton, width: "100" });
            var btnDiv = (this.model.editSettings.editMode != "dialog" && this.model.editSettings.editMode != "dialogtemplate") ? ej.buildTag('div', "", "", { 'class': "e-editform-btn" }) : ej.buildTag('div');
            btnDiv.append(savebtn);
            btnDiv.append(cancelbtn);
            form.appendTo(tbody);
            if (this.model.editSettings.editMode != "dialog" && this.model.editSettings.editMode != "dialogtemplate")
                btnDiv.appendTo(tbody);
            else
                form.append(btnDiv);
            return tbody;
        },
        _externalFormPosition: function () {
            var pos = $(this.element).offset();
            var width = $(this.element).width();
            var height = $(this.element).height();
            var DivElement = $("#" + this._id + "_externalEdit");
            switch (this.model.editSettings.formPosition) {
                case "topright":
                    $(DivElement).find('.e-form-toggle-icon').removeClass('e-bottomleft').addClass('e-topright');
                    $(DivElement).css({ "left": (pos.left + width + 1) + "px", "top": pos.top + "px", "position": "absolute", "width": "290px" });
                    $("#" + this._id + "_eFormContent").height("auto");
                    break;
                case "bottomleft":
                    $(DivElement).find('.e-form-toggle-icon').removeClass('e-topright').addClass('e-bottomleft');
                    $(DivElement).css({ "left": (pos.left) + "px", "top": (pos.top + height + 1) + "px" });
                    $("#" + this._id + "_eFormContent").width("100%");
                    break;
            }
        },
        _setoffsetWidth: function () {
            var tds, $form = this.model.scrollSettings.frozenColumns > 0 ? this.element.find(".gridform") : $("#" + this._id + "EditForm");
            if (this._gridRecordsCount == 0 && this.model.editSettings.editMode != "batch")
                return;
            if (this.model.editSettings.editMode == "batch")
                tds = $form.closest("td");
            else if (this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate" || this.model.editSettings.editMode == "externalform" || this.model.editSettings.editMode == "externalformtemplate")
                tds = $form.find(".e-rowcell").not(".e-unboundcell,.e-templatecell");
            else
                tds = $form.find("tr").find(".e-rowcell").not(".e-unboundcell,.e-templatecell");
            for (var i = 0; i < tds.length; i++)
                this._tdsOffsetWidth[i] = tds.get(i).offsetWidth;
        },
        _bulkChangesAcquired: function () {
            if (this.batchChanges.added.length > 0 || this.batchChanges.changed.length || this.batchChanges.deleted.length)
                return true;
            return false;
        },
        _renderDialog: function () {
            var $dialog = ej.buildTag("div.e-dialog e-dialog-content e-shadow e-widget-content", "", { display: "none" }, { id: this._id + "_dialogEdit" });
            return $dialog;
        },
        
        getCurrentEditCellData: function () {
            if (this.model.isEdit && $("#" + this._id + "EditForm").length) {
                var $element = $("#" + this._id + this._bulkEditCellDetails.fieldName.replace(/[^a-z0-9\s_]/gi, '')), cellValue,
                    column = this.model.columns[this._bulkEditCellDetails.columnIndex], temp1;
                switch (this._bulkEditCellDetails.cellEditType) {
                    case ej.Grid.EditingType.String:
					case ej.Grid.EditingType.Numeric:
                        cellValue = $element.val();
                        break;                                          
                    case ej.Grid.EditingType.Dropdown:
                        cellValue = this._bulkEditCellDetails.isForeignKey ? { "value": $element.ejDropDownList("getSelectedValue"), "text": $element.ejDropDownList("getValue") } : $element.ejDropDownList("getSelectedValue");
                        break;
                    case ej.Grid.EditingType.Boolean:
                        cellValue = $element.is(':checked');
                        break;
                    case ej.Grid.EditingType.DatePicker:
                        cellValue = $element.ejDatePicker("model.value");
                        break;
                    case ej.Grid.EditingType.DateTimePicker:
                        cellValue = $element.ejDateTimePicker("model.value");
                        break;
                    case "edittemplate":
                        temp1 = column.editTemplate.read;
                        if (typeof temp1 == "string")
                            temp1 = ej.util.getObject(temp1, window);
                        cellValue = temp1($element);
                        break;
                }
                if (typeof cellValue == "string" && cellValue.length && column.type == "number")
                   cellValue = ej.globalize.parseFloat(cellValue,this.model.locale);
                return cellValue;
            }
            return null;
        },
        cancelEditCell: function () {
            if (this.model.isEdit) {
                var tr = this.getRows()[this._bulkEditCellDetails.rowIndex], cellData = {}, cell;
                cellData[this._bulkEditCellDetails.fieldName] = this._bulkEditCellDetails.cellValue;
                if ($(tr).hasClass("e-insertedrow"))
                    cell = $(tr).find('.e-rowcell').get(this._bulkEditCellDetails.columnIndex + this.model.groupSettings.groupedColumns.length);
                else
                    cell = $(tr).find('.e-rowcell').get(this._bulkEditCellDetails.columnIndex);
                $(cell).removeClass("e-editedbatchcell").empty().html($($.templates[this._id + "_JSONTemplate"].render(cellData)).find('.e-rowcell').get(this._bulkEditCellDetails.columnIndex).innerHTML);
                this.model.isEdit = false;
                this.element.focus();
            }
        },
        saveCell: function (preventSaveEvent) {
            if (this.model.isEdit) {
                if (!this.editFormValidate())
                    return true;
                var $form = $("#" + this._id + "EditForm"), $targetTR = $form.closest("tr"), $targetTD = $form.closest("td"), $toolBar, tempVal, formattedValue
                , args = {}, column = this.model.columns[this._bulkEditCellDetails.columnIndex], $element = $("#" + this._id + this._bulkEditCellDetails.fieldName.replace(/[^a-z0-9\s_]/gi,'')), getVal, setVal;
                args = {
                    columnName: column.field,
                    value: this.getCurrentEditCellData(),
                    rowData: this._bulkEditCellDetails.rowData,
                    previousValue: this._bulkEditCellDetails.cellValue,
                    columnObject: column,
                    cell: $targetTD,
                    isForeignKey: this._bulkEditCellDetails.isForeignKey
                };
                if (!preventSaveEvent && this._trigger("cellSave", args)) {
                    this._focusElements(args.cell);
                    this._bulkEditCellDetails.cancelSave = true;
                    return;
                }
                if (this._bulkEditCellDetails.cellEditType == "datetimepicker" || this._bulkEditCellDetails.cellEditType == "dropdownedit" || this._bulkEditCellDetails.cellEditType == "datepicker")
                    $element[$element.data("ejWidgets")[0]]("destroy");
                if (!ej.isNullOrUndefined(column.format)) {
                    if ((column.type == "date" || column.type == "datetime") && !ej.isNullOrUndefined(args.value))
                        (!args.isForeignKey) ? args.value = args.value.length > 0 ? new Date(args.value) : args.value : args.value.text = args.value.text.length > 0 ? new Date(args.value.text) : args.value.text;
                
                    formattedValue = this.formatting(column.format, args.isForeignKey ?
                                              (!isNaN(parseFloat(args.value.text)) && isFinite(args.value.text)
                                              ? parseFloat(args.value.text)
                                              : args.value.text) : args.value,this.model.locale);
                    args.cell.empty().html(formattedValue);
                }
                if (this._bulkEditCellDetails.cellEditType == "edittemplate") {                                        
                    ej.createObject(this._bulkEditCellDetails["fieldName"], args.isForeignKey ? args.value.value : args.value, args.rowData);
                    if (ej.isNullOrUndefined(column.format))
                        formattedValue = args.isForeignKey ? args.value.text : args.value
                    args.cell.empty().html(formattedValue);
                }
                else {
                    if (args.columnObject.type == "boolean" || args.columnObject.editType == "booleanedit") {
                        var cellData = {};
                        ej.createObject(args.columnObject.field, args.value, cellData);
                        args.cell.empty().html($($.templates[this._id + "_JSONTemplate"].render(cellData))[0].cells[this._bulkEditCellDetails.columnIndex].innerHTML);						
					}
					else if(args.columnObject.editType == "datepicker" || args.columnObject.editType == "datetimepicker")
						args.cell.empty().html(formattedValue);
                    else {
					    if (ej.isNullOrUndefined(column.format))
					        args.cell.empty().text(args.isForeignKey ? args.value.text : args.value).html();
                    }
                }
                args.cell.removeClass('e-validError');
                if (args.cell.hasClass('e-updatedtd'))
                    args.cell.addClass("e-gupdatenotify");
                args.previousValue = !ej.isNullOrUndefined(args.previousValue) ? (column.type == "date" || column.type == "datetime") ? new Date(args.previousValue) : args.previousValue : "";
                tempVal = args.isForeignKey ? args.value.value : args.value;
                var isValueModified = false;
                if (this._bulkEditCellDetails.type == "date" || this._bulkEditCellDetails.type == "datetime" && !ej.isNullOrUndefined(this._bulkEditCellDetails.format))
                    isValueModified =this._bulkEditCellDetails.cellValue instanceof Date ? this.formatting(this._bulkEditCellDetails.format, this._bulkEditCellDetails.cellValue) != this.formatting(this._bulkEditCellDetails.format, tempVal): true;
                else
                    isValueModified = ((this._bulkEditCellDetails.cellEditType == "datepicker" || this._bulkEditCellDetails.cellEditType == "datetimepicker" || this._bulkEditCellDetails.cellEditType == "dropdownedit")
										 && tempVal instanceof Date && args.previousValue instanceof Date) ? (tempVal.getTime() !== args.previousValue.getTime()) : (typeof (tempVal) == "number" ? tempVal !== parseFloat(args.previousValue) : tempVal !== args.previousValue.toString());
                this.model.isEdit = false;
                if (isValueModified) {
                    this._enableSaveCancel();
                    args.cell.addClass("e-updatedtd e-icon e-gupdatenotify");
                    getVal = ej.getObject(this._bulkEditCellDetails["fieldName"], args.rowData);
                    if (typeof getVal == "string" && getVal.length)
                        setVal = args.isForeignKey ? args.value.value.toString() : args.value.toString();
                    else
                        setVal = args.isForeignKey ? (!isNaN(parseInt(args.value.value)) ? parseInt(args.value.value) : args.value.value) : args.value;
                    if (typeof args.value == "string" && !setVal.length)
                        setVal = null;
                    ej.createObject(this._bulkEditCellDetails["fieldName"], setVal, args.rowData);
                    if ($.inArray(args.rowData, this.batchChanges.changed) == -1 && $.inArray(args.rowData, this.batchChanges.added) == -1)
                        this.batchChanges.changed.push(args.rowData);
					if(this.isejObservableArray){
                        var batchAction;
                        if (args.cell.closest("tr").hasClass("e-insertedrow"))
                            batchAction = "insert";
                        else
                            batchAction = "update";                                                                             
                        this._refreshViewModel(args, batchAction);
                    }
                }
                $targetTR.removeClass("e-editedrow").removeClass("e-batchrow");
                args.cell.removeClass("e-editedbatchcell");
            }
        },
		_refreshViewModel:function(args, batchAction){
            var dm;
            if (!(this._dataSource() instanceof ej.DataManager))
                dm = ej.DataManager(this._dataSource());
            else 
                dm = this._dataSource();
            var query = new ej.Query();
            for (var i = 0; i < this._primaryKeys.length; i++)
               query = query.where(this._primaryKeys[i], ej.FilterOperators.equal, args.rowData[this._primaryKeys[i]]);
            var currentData = dm.executeLocal(query);
            var $dataSource = this._dataSource(undefined, true);
            var index = $.inArray(currentData[0], this._dataSource());
            this.model.editSettings.showConfirmDialog = false;
            switch (batchAction) {
                case "update":                
                $dataSource(args.rowData, index, batchAction);
                break;
                case "remove":
                $dataSource(args.rowData, index, batchAction);               
                break;
                case "insert":
                $dataSource(args.rowData, 0, batchAction);                  
                break;
            }            
        },
        _enableSaveCancel: function () {
            if (this.model.toolbarSettings.showToolbar) {
                $toolBar = this.element.find("#" + this._id + "_toolbarItems");
                $toolBar.ejToolbar("enableItemByID", this._id + "_update");
                $toolBar.ejToolbar("enableItemByID", this._id + "_cancel");
            }
        },
        setCellText: function (rowIndex, cellIndex, value) { /*Supports only local datasource*/
            var byField = typeof cellIndex == "string", rows = this._excludeDetailRows(), cell,
                isGrouped = this.model.groupSettings.groupedColumns.length != 0, isVirtualized = this.model.scrollSettings.allowVirtualScrolling,
                column = this[byField ? "getColumnByField" : "getColumnByIndex"](cellIndex), current = ej.getObject(["currentViewData", (isGrouped ? ".records" : "")].join(""), this.model),
                edited = {}, dm = isVirtualized ? this._dataManager : new ej.DataManager(current),
                key = this._primaryKeys[0], keyValue = byField || ej.getObject(rowIndex + "." + key, isVirtualized ? this._dataManager.dataSource.json : current);

            ej.createObject(column.field, value, edited);

            if (byField) {
                keyValue = rowIndex;
                rowIndex = dm.executeLocal(new ej.Query().select(key)).indexOf(rowIndex);
                cellIndex = this.getColumnIndexByField(column.field);
            }
            if (isVirtualized) {
                var pageSize = this.model.pageSettings.pageSize, page, name, mod = rowIndex % pageSize;
                page = (rowIndex + pageSize - mod)/ pageSize;        
                name = (page - 1) * pageSize; isCached = $.inArray(name, this.virtualLoadedPages) != -1
                if (isCached) {
                    cell = this.getContentTable().find("tr[name=" + name + "]")[mod].cells[cellIndex];
                }
            }

            canSkip = rowIndex == -1 || cellIndex == -1 || (isVirtualized && !isCached)
                || rowIndex > (isVirtualized ? this._dataSource() : current).length || cellIndex > this.model.columns.length;

            if (!canSkip) { /*Skip when not in current page*/
                cell = cell || this._excludeDetailCells(rows[rowIndex])[cellIndex];
                value = column.format === undefined ? value : this.formatting(column.format, value, this.model.locale);
                if(!ej.isNullOrUndefined(column.foreignKeyField) && !ej.isNullOrUndefined(column.foreignKeyValue))					
					value = this._getForeignKeyData(edited)[column.foreignKeyField][column.foreignKeyValue];
				if(column.disableHtmlEncode)
                	$(cell).text(value);
                else
                	cell.innerHTML = value;
                this._trigger("queryCellInfo", { cell: cell, text: cell.innerHTML, column: column, data: edited });
            }
			if(key){
				ej.createObject(key, keyValue, edited);
				this._dataManager.update(key, edited);
			}
        },
        _excludeDetailCells: function ($tr) {
            var $gridCells;
            if (!ej.isNullOrUndefined(this.model.detailsTemplate || this.model.childGrid || this.model.showSummary))
                $gridCells = $($tr.cells).not(".e-detailrowexpand, .e-detailrowcollapse");
            else
                $gridCells = $($tr.cells);
            return $gridCells;
        },
        setCellValue: function (index, fieldName, cellValue) {
            if ($("#" + this._id + "EditForm").length > 0)
                $("#" + this._id + "EditForm").attr("id", "EditForm1");
            if (this.model.editSettings.editMode == "batch" && !this.model.scrollSettings.allowVirtualScrolling && !this.model.scrollSettings.frozenColumns) {
                var data = this.getDataByIndex(index), tr = this._excludeDetailRows()[index], dataIndex, columnIndex = this.getColumnIndexByField(fieldName), proxy = this, editedValue = cellValue, valid = false;
                var column = this.getColumnByField(fieldName), editedTd;
                if ($(tr).hasClass("e-insertedrow"))
                    editedTd = $(tr.cells).not(".e-detailrowcollapse, .e-detailrowexpand")[columnIndex + this.model.groupSettings.groupedColumns.length];
                else
                    editedTd = $(tr.cells).not(".e-detailrowcollapse, .e-detailrowexpand")[columnIndex];
                if (!ej.isNullOrUndefined(column) && !column.isPrimaryKey && column.allowEditing != false) {
                    if (!ej.isNullOrUndefined(column.validationRules)) {/*Check for validation*/
                        $form = ej.buildTag("form", "", {}, { id: this._id + "EditForm" }), $valElem = ej.buildTag("input", "", {}, { id: this._id + column.field, value: cellValue });
                        $form.append($valElem);
                        this.element.append($form);
                        $form.validate({/*Validate the form*/
                            errorPlacement: function (error, element) {
                                if (!proxy._alertDialog) proxy._renderAlertDialog();
                                $("#" + proxy._id + "AlertDialog_wrapper").css("min-height", "");
                                proxy._alertDialog.find(".e-content").text(error.text());
                                proxy._alertDialog.ejDialog("open");
                                proxy.element.find($form).remove();
                                valid = true;
                                return true;
                            },
                        });
                        this.setValidationToField(column.field, column.validationRules);
                    }

                    if (column.foreignKeyValue) {
                        editedValue = this._foreignKeyBinding(columnIndex, cellValue, this._id);/*Get the corresponding foreign key value*/

                        if (editedValue == undefined) {
                            if (!this._alertDialog) this._renderAlertDialog();
                            $("#" + this._id + "AlertDialog_wrapper").css("min-height", "");
                            this._alertDialog.find(".e-content").text(this.localizedLabels.ForeignKeyAlert);
                            this._alertDialog.ejDialog("open");
                            if (!ej.isNullOrUndefined(column.validationRules)) this.element.find($form).remove();
                            return;
                        }
                    }

                    if (!ej.isNullOrUndefined(column.format)) {/*Get the formatted value*/
                        var formattedValue = this.formatting(column.format, column.foreignKeyValue ?
                                                    (!isNaN(parseFloat(cellValue)) && isFinite(cellValue)
                                                    ? parseFloat(cellValue)
                                                    : cellValue) : cellValue, this.model.locale);
                        editedValue = formattedValue;
                    }
                    


                    if (!ej.isNullOrUndefined(column.validationRules)) {
                        $($form).validate().form();
                        this.element.find($form).remove();
                    }
                    $("#EditForm1").attr("id", this._id + "EditForm");
                    if (!valid && editedTd.innerHTML != editedValue) {
                        if ($(editedTd).has("form").length > 0) this.model.isEdit = false;
                        if ($(editedTd).hasClass("e-boolrowcell"))
                            $(editedTd).find("input").attr("checked", editedValue);
                        else
                            editedTd.innerHTML = editedValue;
                        $(editedTd).addClass("e-updatedtd e-icon e-gupdatenotify");
                        $(editedTd).removeClass("e-validError e-editedbatchcell");
                        ej.createObject(fieldName, cellValue, data);
                        $.inArray(data, this.batchChanges.changed) == -1 && this.batchChanges.changed.push(data);
                        this._enableSaveCancel();
                    }
                }
            }
        },
        setDefaultData: function (defaultData) {
            if (ej.isNullOrUndefined(defaultData)) {
                var fieldNames = [];
                var columns = this.model.columns;
                for (var column = 0; column < this.model.columns.length; column++)
                    fieldNames.push(this.model.columns[column]["field"]);
                if (ej.isNullOrUndefined(this._bulkEditCellDetails._data))
                    this._bulkEditCellDetails._data = [];
                defaultData = {};
                var setter = function (field, value) { ej.createObject(field, value, defaultData) };
                for (var i = 0; i < fieldNames.length; i++) {
                    var index = i, field = fieldNames[i], columnType = columns[i].type, val = ej.getObject(field, this._bulkEditCellDetails._data[0]);
                    var isChild = !ej.isNullOrUndefined(this.model.parentDetails) ? this.model.parentDetails.parentKeyField : null;
                    if (field === isChild)
                        this.model.columns[index].defaultValue = this.model.parentDetails.parentKeyFieldValue;
                    if (!ej.isNullOrUndefined(this.model.columns[index]["defaultValue"])) {
                        setter(field, this.model.columns[index]["defaultValue"]);
                    }
                    else {
                        switch (columnType) {
                            case "number":
                                setter(field, 0);
                                break;
                            case "string":
                                setter(field, null);
                                break;
                            case "boolean":
                                setter(field, false);
                                break;
                            case "object":
                                if ($.isArray(val))
                                    setter(field, new Array());
                                else
                                    setter(field, null);
                            case "datetime":
                            case "date":
                                setter(field, null);
                        }
                    }
                }
            }
            this._bulkEditCellDetails.defaultData = defaultData;
        },
        _bulkDelete: function (index) {
            if (this.model.editSettings.allowDeleting) {
                if (ej.isNullOrUndefined(index))
                    index = this._selectedRow();
                if (index == -1) {
                    alert(this.localizedLabels.DeleteOperationAlert);
                    return;
                }
                var tr, $tr, data, args = {};
                if (this.multiDeleteMode && this.selectedRowsIndexes.length > 1) {
                    data = [];
                    $tr = this.getSelectedRows();
                    Array.prototype.push.apply(data, this.getSelectedRecords());
                    Array.prototype.push.apply(this.batchChanges.deleted, this.getSelectedRecords());
                }
                else
                    tr = this.getRows()[index], $tr = $(tr), data = this.getDataByIndex(index);
                args = {
                    primaryKey: this._primaryKeys,
                    rowIndex: index,
                    rowData: data,
                    row: $tr
                };
                if (this._trigger("beforeBatchDelete", args))
                    return;
				if(this.isejObservableArray)                   
                    this._refreshViewModel(args, "remove");
                if ($tr.hasClass("e-insertedrow")) {
                    $tr.remove();
                    index = $.inArray(tr, this._bulkEditCellDetails.insertedTrCollection);
                    if (index != -1) {
                        this._bulkEditCellDetails.insertedTrCollection.splice(index, 1);
                        this.batchChanges.added.splice(index, 1);
                    }
                }
                else {
                    $tr.hide();
					if(args.rowIndex == 0 || $tr.hasClass("e-firstrow")){
						$tr.hasClass("e-firstrow") && this.getContentTable().find("tr").removeClass("e-firstrow");
						this.getContentTable().find("tr:visible").first().addClass("e-firstrow");
					}
                    if (!$.isArray(data))
                        this.batchChanges.deleted.push(data);
                }
                this._gridRows = this.getContentTable().find("td.e-rowcell").closest("tr").toArray();
                this._enableSaveCancel();
                this._selectedRow(-1);
                args = {
                    primaryKey: this._primaryKeys,
                    rowIndex: index,
                    rowData: data
                };
                this._trigger("batchDelete", args);
                if (this.model.isEdit)
                    this.cancelEdit();
            }
        },
        _bulkAddRow: function (defaultData) {
            var  $form = $("#" + this._id + "EditForm");
            if ($form.length && !this.editFormValidate())
                return true;
			if (this.model.editSettings.allowAdding) {
                var args = {}, $tr, editCellIndex, rows = this.getRows();
                if (!ej.isNullOrUndefined(defaultData))
                    this._bulkEditCellDetails.defaultData = defaultData;
                ej.isNullOrUndefined(this._bulkEditCellDetails.defaultData) && this.setDefaultData();
                args = {
                    defaultData: $.extend(true, {}, this._bulkEditCellDetails.defaultData),
                    primaryKey: this._primaryKeys,
                };
                if (this._trigger("beforeBatchAdd", args))
                    return;
                $tr = $($.render[this._id + "_JSONTemplate"](args.defaultData)).addClass("e-insertedrow");
                rows != null && $(rows[0]).hasClass("e-alt_row") && $tr.removeClass("e-alt_row");
                if (this.model.editSettings.rowPosition == "top")
                    this.getContentTable().first().find('tbody').first().prepend($tr);
                else if (this.model.editSettings.rowPosition == "bottom")
                    this.getContentTable().first().find('tbody').first().append($tr);
                if (this._gridRecordsCount === 0)
                    this.getContentTable().find("tbody .emptyrecord").first().remove();
                this._gridRows = this.getContentTable().find("td.e-rowcell").closest("tr").toArray();
                for (var i = 0; i < this.model.groupSettings.groupedColumns.length; i++)
                    $tr.prepend(ej.buildTag("td.e-indentcell"));
                this._bulkEditCellDetails.insertedTrCollection.push($tr.get(0));
                this.batchChanges.added.push(args.defaultData);
                this._enableSaveCancel();
                var rowindex = this._gridRows.length - 1;
                if (this.model.editSettings.rowPosition == "bottom") {
                    editCellIndex = this._findNextEditableCell(0);
                    this.selectRows(rowindex);
                    this.editCell(rowindex, this.model.columns[editCellIndex].field);
                }
                else {
                    editCellIndex = this._findNextEditableCell(0);
                    this.selectRows(0);
                    this.editCell(0, this.model.columns[editCellIndex].field);
                }
                $tr.find(".e-rowcell").addClass("e-updatedtd e-icon e-gupdatenotify");
                args = { defaultData: args.defaultData };
                $.extend(args, {
                    columnObject: this.model.columns[editCellIndex],
                    columnIndex: editCellIndex,
                    row: $tr,
                    primaryKey: this._primaryKeys,
                    cell: $($tr[0].cells[editCellIndex])
                });
                this._trigger("batchAdd", args);
            }
        },
        getDataByIndex: function (rowIndex) {
            var $tr = $(this.getRows()[rowIndex]), insertedRowIndex, currentRowData, index;
            if ($tr.hasClass("e-insertedrow")) {
                insertedRowIndex = $.inArray($tr[0], this._bulkEditCellDetails.insertedTrCollection);
                return this.batchChanges.added[insertedRowIndex];
            }
            else
                return this._bulkEditCellDetails._data[rowIndex - this._bulkEditCellDetails.insertedTrCollection.length];

        },
        
        refreshBatchEditChanges: function () {
            this._bulkEditCellDetails = {
                cellValue: null,
                rowIndex: -1,
                _data: null,
                columnIndex: -1,
                fieldName: null,
                cellEditType: "",
                cancelSave: false,
                defaultData: null,
                insertedTrCollection: [],
                rowData: null,
                isForeignKey: false
            };
            this.batchChanges = {
                added: [],
                deleted: [],
                changed: []
            };
        },
        refreshBatchEditMode: function () {
            if (this.model.editSettings.editMode == "batch") {
                this.refreshBatchEditChanges();
                this._bulkEditCellDetails._data = $.extend(true, [], this.getCurrentViewData());
            }
        },
        
        batchCancel: function () {
            this.cancelEdit();
        },
        
        batchSave: function () {
            var args = {}, deferedObject, gridObject = this;
            this.saveCell();
            args["batchChanges"] = this.getBatchChanges();
            if (this._trigger("beforeBatchSave", args))
                return;
            args = {};
            args.requestType = "batchsave";
            this._sendBulkReuqest(this.getBatchChanges(), args);
        },
        _sendBulkReuqest: function (batchChanges, args) {
            var deferedObject = this._dataManager.saveChanges(batchChanges, this._primaryKeys[0], this.model.query._fromTable, this.model.query), gridObject = this;
            if (this._dataManager instanceof ej.DataManager && !this._dataManager.dataSource.offline) {
                deferedObject.done(function (e) {
                    gridObject._processBindings(args);
                });
                deferedObject.fail(function (e) {
                    var args = { error: e.error };
                    gridObject._trigger("actionFailure", args);
                });
            }
            else
                this._processBindings(args);

        },
        
        getBatchChanges: function () {
            return this.batchChanges;
        },
        
        editCell: function (index, fieldName) {
            if (this.element.ejWaitingPopup("model.showOnInit"))
                return;
            if (this.model.editSettings.allowEditing && $.inArray(fieldName, this._disabledEditableColumns) == -1) {
                var $form = $("#" + this._id + "EditForm");
                this.model.isEdit && this.saveCell();
                if ($.isFunction($.validator) && $form.length && $form.validate().errorList.length)
                    return;
                var $targetTR = $(this.getRows()[index]), columnIndex = this.getColumnIndexByField(fieldName), $targetTd = $targetTR.find(".e-rowcell").eq(columnIndex), column = this.model.columns[columnIndex], rowData = this.getDataByIndex(index);
                var args = {
                    validationRules: ej.isNullOrUndefined(column.validationRules) ? {} : $.extend(true, {}, column.validationRules),
                    columnName: column.field,
                    value: ej.getObject(ej.isNullOrUndefined(fieldName) ? "" : fieldName, rowData),
                    rowData: rowData,
                    primaryKey: this._primaryKeys,
                    columnObject: column,
                    cell: $targetTd,
                    isForeignKey: !ej.isNullOrUndefined(column.foreignKeyValue) && this.model.editSettings.editMode == "batch" ? true : false,
                }, isEditable = true;
                this._batchEditRowData = rowData;
                if (this._trigger("cellEdit", args))
                    return;
                if ($targetTR.hasClass("e-insertedrow")) args.requestType = "add";
                if ($.inArray(fieldName, this._primaryKeys) != -1 || args.columnObject.allowEditing === false || (args.columnObject.template && (args.columnObject["allowEditing"] == false || !args.columnObject["field"])) || args.columnObject.commands) {
                    $.extend(this._bulkEditCellDetails, {
                        cellValue: args.value,
                        rowIndex: index,
                        fieldName: fieldName,
                        rowData: args.rowData,
                        columnIndex: columnIndex,
                        isForeignKey: ej.isNullOrUndefined(args.columnObject.foreignKeyValue) ? false : true
                    });
                    isEditable = false;
                }
                if ($targetTR.hasClass("e-insertedrow") && (args.columnObject.isPrimaryKey))
                    isEditable = true;
                if (isEditable) {
                    $.extend(this._bulkEditCellDetails, {
                        rowIndex: index,
                        cellValue: args.value,
                        columnIndex: columnIndex,
                        format: column.format,
                        type: column.type,
                        fieldName: fieldName,
                        cellEditType: args.columnObject.editType,
                        rowData: rowData,
                        isForeignKey: ej.isNullOrUndefined(args.columnObject.foreignKeyValue) ? false : true
                    });
                    this._renderBulkEditObject(args, $targetTd);
                    $targetTR.addClass("e-editedrow").addClass("e-batchrow");
                    args.cell.addClass("e-editedbatchcell");
                    if (args.columnObject.editType == "booleanedit")
                        args.cell.addClass("e-boolrowcell");
                }
            }
        },
        _findNextEditableCell: function (columnIndex) {
            var endIndex = this.model.columns.length;
            for (var i = columnIndex; i < endIndex; i++) {
                if (!this.model.columns[i].template && !this.model.columns[i].commands && this.model.columns[i].visible)
                    return i;
            }
            return -1;
        },
        _findNextCell: function (columnIndex, direction) {
            var splittedColumn, visibleColumns = [], predicate, rows = this.getRows();
			if (this.model.columns[columnIndex].template) 
                this.model.columns[columnIndex].__isTemplate = true;  
			if(this.model.columns[columnIndex].commands)
				this.model.columns[columnIndex].__isCommand = true; 
            predicate = ej.Predicate("visible", "equal", true).and("__isTemplate", "notequal", true).and("__isCommand", "notequal", true);
            if (!$(rows[this._bulkEditCellDetails.rowIndex]).hasClass("e-insertedrow"))
                predicate = predicate.and("allowEditing", "notequal", false);
            splittedColumn = direction == "right" ? this.model.columns.slice(columnIndex) : this.model.columns.slice(0, columnIndex + 1).reverse();
            visibleColumns = ej.DataManager(splittedColumn).executeLocal(ej.Query().where(predicate));
            if (visibleColumns.length == 0 && (!(direction == "left" && this._bulkEditCellDetails.rowIndex == 0) && !(direction == "right" && this._bulkEditCellDetails.rowIndex + 1 == this.getRows().length))) {
                splittedColumn = direction == "right" ? this.model.columns.slice(0, columnIndex) : this.model.columns.slice(columnIndex).reverse();
                visibleColumns = ej.DataManager(splittedColumn).executeLocal(ej.Query().where(predicate));
                this._bulkEditCellDetails.rowIndex = visibleColumns.length && direction == "right" ? this._bulkEditCellDetails.rowIndex + 1 : this._bulkEditCellDetails.rowIndex - 1;
            }
            return visibleColumns.length ? $.inArray(visibleColumns[0], this.model.columns) : -1;
        },
        _moveCurrentCell: function (direction) {
            var editCellIndex, rowIndex = this._bulkEditCellDetails.rowIndex, currentRow, $form = $("#" + this._id + "EditForm");
            if (this._bulkEditCellDetails.rowIndex == -1 && this._bulkEditCellDetails.columnIndex == -1)
                return true;
            switch (direction) {
                case "right":
                    if ((this._bulkEditCellDetails.rowIndex == this.getRows().length - 1 && this._bulkEditCellDetails.columnIndex == this.model.columns.length - 1) || (!this.element.is(document.activeElement) && $form.length == 0))
                        return true;
                    if (this._bulkEditCellDetails.columnIndex == this.model.columns.length - 1) {
                        editCellIndex = 0;
                        this._bulkEditCellDetails.rowIndex = this._bulkEditCellDetails.rowIndex + 1;
                    }
                    else
                        editCellIndex = this._bulkEditCellDetails.columnIndex + 1;
                    if(!ej.isNullOrUndefined(this.model.columns[editCellIndex].template) || !ej.isNullOrUndefined(this.model.columns[editCellIndex].commands) || this.model.columns[editCellIndex].visible === false || this.model.columns[editCellIndex].allowEditing === false)
                        editCellIndex = this._findNextCell(editCellIndex, direction);
                    this._bulkEditCellDetails.rowIndex != rowIndex && this.selectRows(this._bulkEditCellDetails.rowIndex);
                    editCellIndex != -1 && this.editCell(this._bulkEditCellDetails.rowIndex, this.model.columns[editCellIndex].field);
                    break;
                case "left":
                    if ((this._bulkEditCellDetails.rowIndex == 0 && this._bulkEditCellDetails.columnIndex == 0) || (!this.element.is(document.activeElement) && $form.length == 0))
                        return true;
                    if (this._bulkEditCellDetails.columnIndex == 0) {
                        editCellIndex = this.model.columns.length - 1;
                        this._bulkEditCellDetails.rowIndex = this._bulkEditCellDetails.rowIndex - 1;
                        this.selectRows(this._bulkEditCellDetails.rowIndex);
                    }
                    else
                        editCellIndex = this._bulkEditCellDetails.columnIndex - 1;
                    if(!ej.isNullOrUndefined(this.model.columns[editCellIndex].template) || !ej.isNullOrUndefined(this.model.columns[editCellIndex].commands) || this.model.columns[editCellIndex].visible === false || this.model.columns[editCellIndex].allowEditing === false)
                        editCellIndex = this._findNextCell(editCellIndex, direction);
                    this._bulkEditCellDetails.rowIndex != rowIndex && this.selectRows(this._bulkEditCellDetails.rowIndex);
                    editCellIndex != -1 && this.editCell(this._bulkEditCellDetails.rowIndex, this.model.columns[editCellIndex].field);
                    break;
                case "up":
                    if (this._bulkEditCellDetails.rowIndex == 0)
                        return;
                    editCellIndex = this._bulkEditCellDetails.columnIndex;
                    this.selectRows(this._bulkEditCellDetails.rowIndex - 1);
                    this.editCell(this._bulkEditCellDetails.rowIndex - 1, this.model.columns[this._bulkEditCellDetails.columnIndex].field);
                    break;
                case "down":
                    if (this._bulkEditCellDetails.rowIndex == this.getRows().length - 1)
                        return;
                    editCellIndex = this._bulkEditCellDetails.columnIndex;
                    this.selectRows(this._bulkEditCellDetails.rowIndex + 1);
					if(this._bulkEditCellDetails.columnIndex != -1)
						this.editCell(this._bulkEditCellDetails.rowIndex + 1, this.model.columns[this._bulkEditCellDetails.columnIndex].field);
                    break;

            }
            addedRow = !$(this.getRows()[this._bulkEditCellDetails.rowIndex]).hasClass("e-insertedrow");
            if (editCellIndex != -1 && (this.model.columns[editCellIndex].commands || (this.model.columns[editCellIndex].isPrimaryKey && addedRow) || this.model.columns[editCellIndex].template))
                this.element.focus();
            return false;
        },
        _renderBulkEditObject: function (cellEditArgs, $td) {
            var $form = ej.buildTag("form", "", {}, { id: this._id + "EditForm" }), $bulkEditTemplate = this._bulkEditTemplate, mappingName = this._id + cellEditArgs.columnObject.field, $element, htmlString, cellData = {};
            ej.createObject(cellEditArgs.columnObject.field, cellEditArgs.value, cellData);
            var args = { requestType: cellEditArgs.requestType };
            $td.empty();
            if (!$td.parent().is(":last-child")){
                $td.addClass('e-validError');
                $td.removeClass('e-gupdatenotify');
             }
            htmlString = $bulkEditTemplate.find("#" + cellEditArgs.columnObject.field.replace(/\./g, ej.pvt.consts.complexPropertyMerge) + "_BulkEdit").html();
            $element = $($.templates(htmlString).render(cellData));
            if ($element.get(0).tagName == "SELECT") {
                var cellValue = ej.getObject(cellEditArgs.columnObject.field, cellData);
                $element.val(ej.isNullOrUndefined(cellValue) ? "" : cellValue.toString());
                $element.val() == null && $element.val($element.find("option").first().val());
            }
            $form.append($element);
            $td.append($form);
            this._setoffsetWidth();
            this._refreshEditForm(args);
            if ($.isFunction($.validator) && !$.isEmptyObject(cellEditArgs.validationRules)) {
                this.initValidator();
                this.setValidationToField(cellEditArgs.columnObject.field, cellEditArgs.validationRules);
            }
            this.model.isEdit = true;
        },
        _triggerConfirm: function (args) {
            if (args !== undefined && args.model.text == this.localizedLabels.OkButton) {
                if (this._confirmDialog.find(".e-content").text() == this.localizedLabels.BatchSaveConfirm)
                    this.batchSave();
                else if (this._confirmDialog.find(".e-content").text() == this.localizedLabels.ConfirmDelete) {
                    if (this.model.editSettings.editMode == "batch")
                        this._bulkDelete()
                    else {
                        if (this.multiDeleteMode)
                            this._multiRowDelete();
                      else
                        if (!ej.isNullOrUndefined(this._cDeleteData)) {
                            this.deleteRow(this._cDeleteData);
                            this._cDeleteData = null;
                          }
                        else
                            this.deleteRow();
                    }
                }
                else if (this._confirmDialog.find(".e-content").text() == this.localizedLabels.CancelEdit)
                    this.cancelEdit();
                else {
                    this._confirmedValue = true;
                    this._processBindings(this._requestArgs);
                }
            }
            else {
                if (this._confirmDialog.find(".e-content").text() != this.localizedLabels.BatchSaveConfirm && this._confirmDialog.find(".e-content").text() != this.localizedLabels.ConfirmDelete) {
                    if (this._confirmDialog.find(".e-content").text() != this.localizedLabels.CancelEdit) {
                        switch (this._requestArgs.requestType) {
                            case "grouping":
                                this.model.groupSettings.groupedColumns.pop();
                                break;
                            case "ungrouping":
                                this.model.groupSettings.groupedColumns.push(this._requestArgs.columnName);
                                break;
                            case "sorting":
                                this._cSortedDirection = this._cSortedColumn = null;
                                break
                            case "filtering":
                                this.model.filterSettings.filteredColumns.reverse().splice(0, this._requestArgs.currentFilterObject);
                                this.model.filterSettings.filteredColumns.reverse();
                                break;
                            case "paging":
                                this._currentPage(this._requestArgs.previousPage);
                                this.getPager().ejPager("model.currentPage", this._requestArgs.previousPage);
                                break

                        }
                    }
                }
                this._confirmedValue = false;
            }
            this._requestArgs = null;
            this._confirmDialog.ejDialog("close");
        },
        _batchCellValidation:function(index) {
            var $row = this.getRowByIndex(index);
            if (this.model.editSettings.editMode=="batch" && this.model.isEdit && $row.hasClass('e-insertedrow') ){              
                for (i = 0; i < this._validatedColumns.length; i++) {
                      var colindex = this.getColumnIndexByField(this._validatedColumns[i])
                           if (!this.editFormValidate())
                                 return true;                         
                 this.editCell(index, this.model.columns[colindex].field);                          
                    }
               }
         },
        _saveCellHandler: function (e) {
            var $target = $(e.target);
            e.stopPropagation();
            var index=(this.model.editSettings.rowPosition == "top" || this._gridRows == null)?0:this._gridRows.length - 1;
            if ($target.closest(".e-popup").length == 0 && $target.closest(".e-rowcell").find("#" + this._id + "EditForm").length == 0) {
                if ($(this.getRows()).hasClass("e-insertedrow"))
                    this._batchCellValidation(index);
                this.saveCell();
            }
        },
        initValidator: function () {
            var gridObject = this, elements = this.model.scrollSettings.frozenColumns > 0 || this.model.editSettings.showAddNewRow ? this.element.find(".gridform") : $("#" + this._id + "EditForm");
            for (var i = 0; i < elements.length ; i++) {
                elements.eq(i).validate({
                    ignore: ".e-hide",
                    errorClass: 'e-field-validation-error',
                    errorElement: 'div',
                    wrapper: "div",
                    errorPlacement: function (error, element) {
                        gridObject._renderValidator(error, element);
                    },

                });
            }
        },
        _renderValidator: function (error, element) {          
            if (element.is(":hidden"))
                element = element.siblings("input:visible");
            if (!element.length)
                return;
            var $td = element.closest(this.model.editSettings.editMode == "inlineform" ? "div" : "td"), $container = $(error).addClass("e-error"),
             $tail = ej.buildTag("div.e-errortail e-toparrow");
            $td.find(".e-error").remove();

            if (element.parent().hasClass("e-in-wrap"))
                $container.insertAfter(element.closest(".e-widget"));
            else
                $container.insertAfter(element);
                     
            var oTop = error[0].offsetTop, top = ($td.hasClass("e-validError") ^ this.model.allowScrolling) ? error.closest("td").offset().top + oTop : oTop,
                eleExceed = top + error[0].offsetHeight > (this.model.scrollSettings.frozenColumns > 0 ? this.getContent().find(".e-movablecontent") : this.getContent()).height(),
                isValidationExceed = (this.model.editSettings.editMode == "normal" || this.model.editSettings.editMode == "batch")&& eleExceed,
                doInvert = isValidationExceed && this.model.allowScrolling;

            if (isValidationExceed && !this.model.allowScrolling) {
                $td.removeClass("e-validError");
                error.css("position", "absolute").find(".e-field-validation-error").css("position", "relative");
            }
            var errorElement = error.find(".e-field-validation-error");
            if (this.model.scrollSettings.frozenColumns == 0)
            if (error.width() > error.parents("td").outerWidth()) errorElement.width(element.width() - 5);
            if (this.model.allowScrolling && !$td.hasClass("e-validError"))
                $td.addClass("e-validError");

            var operation = doInvert ? "append" : "prepend";
            $container[operation]($tail);

            if (this.model.enableRTL)
                this.model.editSettings.editMode != "dialog" && $container.offset({ top: element.offset().top + element.height() });
            else
                this.model.editSettings.editMode != "dialog" && $container.offset({ left: element.offset().left, top: element.offset().top + element.height() });

            if (doInvert) {                
                var top = $container.css('top');
                $tail.addClass("e-bottomarrow");
                $container.css({
                    'bottom': top,
                    'top': 'auto'
                });
            }

            $container.show("slow");            
        },

        setValidation: function () {
            for (var i = 0; i < this.model.columns.length; i++) {
                if (!ej.isNullOrUndefined(this.model.columns[i]["validationRules"])) {
                    this.setValidationToField(this.model.columns[i].field, this.model.columns[i].validationRules);
                }
            }
        },
        
        setValidationToField: function (name, rules) {
            var fName = name, ele;
            if (!ej.isNullOrUndefined(name))
                fName = fName.replace(/[^a-z0-9\s_]/gi, '');
            if (this.model.editSettings.editMode == "batch")
                var form = this.element.find("#" + this._id + "EditForm");
            else if(this.model.editSettings.showAddNewRow)
                var form = $(this.getRows()).hasClass("e-editedrow") ? this.element.find(".e-editedrow .gridform") : this.element.find(".e-addedrow .gridform");
            else
                var form = this.element.find(".gridform");
            ele = form.find("#" + this._id + fName).length > 0 ? form.find("#" + this._id + fName) : form.find("#" + fName);
            if (rules["regex"]) {
                rules[name + "regex"] = rules["regex"]; delete rules["regex"];
                $.validator.addMethod(fName + "regex", function (value, element, options) {
                    var ptn = options instanceof RegExp ? options : new RegExp(options);
                    return ptn.test(value);
                }, ej.getObject("messages.regex", rules) || this.getColumnByField(name).headerText + " should match the given pattern");
            }
            !ele.attr("name") && ele.attr("name", name);
            ele.rules("add", rules);
            var validator = $("#" + this._id + "EditForm").validate();
            validator.settings.messages[name] = validator.settings.messages[name] || {};
            if (!ej.isNullOrUndefined(rules["required"])) {
                if (!ej.isNullOrUndefined(rules["messages"] && rules["messages"]["required"]))
                    var message = rules["messages"]["required"];
                else
                    var message = $.validator.messages.required;
                if (message.indexOf("This field") == 0)
                    message = message.replace("This field", this.getColumnByField(name).headerText);               
                validator.settings.messages[name]["required"] = message;
                if (ele.hasClass("e-datepicker"))
                    ele.ejDatePicker({watermarkText: ""});
            }
        },
        _renderConfirmDialog: function () {
            var $contentDiv = ej.buildTag('div.e-content', this.localizedLabels.BatchSaveConfirm)
            , $buttons = ej.buildTag('span.e-buttons', "<input type='button' id=" + this._id + 'ConfirmDialogOK' + " value='" + this.localizedLabels.OkButton + "' /> "
                + "<input type='button' id=" + this._id + 'ConfirmDialogCancel' + " value='" + this.localizedLabels.CancelButton + "' />");

            this._confirmDialog = ej.buildTag('div#' + this._id + 'ConfirmDialog');
            this._confirmDialog.append($contentDiv).append($buttons);
            this.element.append(this._confirmDialog);
            $buttons.find("input").ejButton({
                cssClass: this.model.cssClass,
                showRoundedCorner: true,
                size: "mini",
                click: $.proxy(this._triggerConfirm, this)
            });
            this._renderFDialog(this._id + 'ConfirmDialog');
            this._confirmDialog.ejDialog({ width: "auto",minWidth:0,minHeight:0, enableModal: true });
        },
        _unboundClickHandler: function (e) {
            var $target = $(e.target).closest("button");
            if ($target.hasClass("e-button") && ($target.hasClass("e-disable") || $target.prop("disabled"))) return;
            var $editTrLen = 0, params = {};
            if ($(e.target).hasClass("e-unboundcelldiv"))
                return;
            var index = $target.hasClass("e-savebutton") ? this.getIndexByRow($(".e-editedrow")) : this.getIndexByRow($target.closest("tr"));
			if (this.model.isEdit && $target.hasClass("e-editbutton")) {
                this._unboundRow = $target.closest("tr");
                return;
            }
            var rowData = this._currentJsonData[index];
            var btnObj = $($target).ejButton("instance");
			 if (this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlinetemplate")
                $editTrLen = $("#" + this._id).find(".e-editedrow").length;
            this.model.allowSelection && !this.model.isEdit && this.selectRows(this.getIndexByRow($target.closest("tr")) - $editTrLen);
            if ($target.hasClass("e-cancelbutton"))
                this.model.isEdit = false;
            $.isFunction($.fn.ejDatePicker) && $("#" + this._id + "EditForm").find(".e-datepicker").ejDatePicker("hide");
            if ($target.hasClass("e-editbutton")) {
                if (this.model.isEdit)
                    this.cancelEdit();
                var $tr = this.getRowByIndex(index);
                this.startEdit($tr);
            } else if ($target.hasClass("e-deletebutton")) {
                var $tr = this.getRowByIndex(index);
                if (this.model.editSettings.showDeleteConfirmDialog) {
                    this._toolbarOperation(this._id + "_delete");
                    return;
                }
                this.deleteRow($tr);
            }
            else if ($target.hasClass("e-savebutton")) {
                this.endEdit();
                rowData = this._currentJsonData[index];
            }
            else if ($target.hasClass("e-cancelbutton"))
                this.cancelEdit();
            params = { rowIndex: index, data: rowData, buttonModel: btnObj.model };
            if (ej.raiseWebFormsServerEvents) {
                var serverArgs = { model: this.model, originalEventType: "commandButtonClick" };
                var clientArgs = params;
				if(!ej.isNullOrUndefined(this.model.serverEvents) && $.inArray("commandButtonClick",this.model.serverEvents) != -1)
                  ej.raiseWebFormsServerEvents("commandButtonClick", serverArgs, clientArgs);
            }
        },
          
        addRecord: function (data, serverChange) {
            if (this.model.editSettings.allowAdding && ($(".e-gridcontent").find(".gridform").length == 0)) {
            if (data) {
                if (this.model.editSettings.editMode == "normal" || this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate") {
                    var $addRow = ej.buildTag('tr.e-addedrow');
                    this.getContentTable().find('tbody').first().prepend($addRow);
                }
                var args = { data: data };
                args.action = "add";
                args.selectedRow = this._selectedRow();
                this._cAddedRecord = data;
                args.requestType = ej.Grid.Actions.Save;
                this._updateAction(args);
                args.selectedRow  != -1 && this.selectRows( args.selectedRow + 1)
                if (this._isUnboundColumn)
                    this._refreshUnboundTemplate(this.getContentTable());
                if (!serverChange) {
                    if ((this.model.editSettings.editMode == "normal" || this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate") && this.model.allowPaging && this.model.pageSettings.pageSize < this.model.currentViewData.length && this.model.groupSettings.groupedColumns.length == 0 && !this.model.editSettings.showAddNewRow)
                        this.getContentTable().get(0).lastChild.removeChild(this.getContentTable().get(0).lastChild.lastChild);
                }
            } else
                    this._startAdd();
            }
        },
        
        updateRecord: function (keyField, data, action) {
            this._updateDeleteRecord(keyField, data, "update");
            if (this.model.editSettings.editMode != 'batch' && (this.model.sortSettings.sortedColumns.length ||  this.model.summaryRows.length > 0 || this.model.groupSettings.groupedColumns.length || !ej.isNullOrUndefined(this._searchCount) || this.filterColumnCollection.length))
                this.refreshContent();
        },
        _updateDeleteRecord: function (keyField, data, action) {
            var dataMgr = ej.DataManager(this._currentJsonData), dataFilter, index, $row, $newrow;
            dataFilter = dataMgr.executeLocal(ej.Query().where(keyField, ej.FilterOperators.equal, data[keyField]));
            if (dataFilter.length) {
                index = $.inArray(dataFilter[0], this._currentJsonData);
                if (index != -1) {
                    $row = this.getRowByIndex(index);
                    if (action == "update") {
                        ej.copyObject(dataFilter[0], data);
                        $newrow = $($.render[this._id + "_JSONTemplate"](dataFilter));
                        $row.hasClass("e-alt_row") ? $newrow.addClass("e-alt_row") : $newrow.removeClass("e-alt_row");
                        $row.replaceWith($newrow);
                        if (this._isUnboundColumn)
                            this._refreshUnboundTemplate(this.getContentTable());
                        if (this.model.editSettings.editMode == 'batch')
                            this.batchChanges.changed.push(dataFilter[0]);
                        else
                            this._dataManager[action](keyField, data);
                    }
                    else {
                        if ($.inArray(index, this.selectedRowsIndexes)==-1) 
                            this.selectedRowsIndexes.push(index);
                        this.deleteRow($row);
                    }
                    if (this.model.editSettings.editMode == 'batch') {
                        this.batchSave();
                        this._confirmedValue=true;
                    }
                }
            }
           
        },
        
        deleteRecord: function (keyField, data) {
            this._updateDeleteRecord(keyField, data, "remove");
        },
    };
})(jQuery, Syncfusion);;
(function ($, ej, undefined) {
    ej.gridFeatures = ej.gridFeatures || {};
    ej.gridFeatures.sort = {
        _addSortElementToColumn: function (field, direction) {
            var duplicateColumn = ej.DataManager(this.model.columns).executeLocal(ej.Query().where("field", "equal", field)), imageDirection;
            if (duplicateColumn.length > 1)
                var column = this.getColumnByHeaderText(this._$curSElementTarget.text());
            else
                var column = this.getColumnByField(field);
            if (ej.isNullOrUndefined(column))
                return;
            var index = $.inArray(column, this.model.columns);
            var sortcolumn = this.getsortColumnByField(field);
            var sortindex = $.inArray(sortcolumn, this.model.sortSettings.sortedColumns);
            var $headerCellDiv = this.getHeaderTable().find("thead tr:not('.e-stackedHeaderRow')").find(".e-headercell").not(".e-detailheadercell").eq(index).find(".e-headercelldiv");
            direction = ej.isNullOrUndefined(direction) ? "ascending" : direction.toLowerCase();
            $headerCellDiv.find(".e-ascending,.e-descending").remove();
            if (this.model.allowGrouping && this.model.groupSettings.groupedColumns.length != 0)
                this.element.find(".e-groupdroparea").find("div[ej-mappingname='" + field + "']").find(".e-ascending,.e-descending").not(".e-ungroupbutton").remove();
            imageDirection = direction != "descending" ? "e-rarrowup-2x" : "e-rarrowdown-2x";
            var opacity = 1;
            if (this.model.allowSorting && this.model.allowMultiSorting && this.model.sortSettings.sortedColumns.length > 1) {
                for (var i = 1; i <= sortindex; i++) {
                    opacity = opacity + 1;
                }
                if ($headerCellDiv.css("text-align") == "right") {
                    $headerCellDiv.prepend(this._createSortNumber(opacity, $headerCellDiv).addClass("e-sortnumber"));
                    $headerCellDiv.append(this._createSortElement().addClass("e-" + (direction || "ascending") + " " + imageDirection));
                }
                else {
                    $headerCellDiv.prepend(this._createSortNumber(opacity, $headerCellDiv).addClass("e-sortnumber"));
                    $headerCellDiv.append(this._createSortElement().addClass("e-" + (direction || "ascending") + " " + imageDirection));
                }
            }
            else
                $headerCellDiv.append(this._createSortElement().addClass("e-" + (direction || "ascending") + " " + imageDirection));
            if (this.model.allowGrouping && this.model.groupSettings.groupedColumns.length != 0)
                this.element.find(".e-groupdroparea").find("div[ej-mappingname='" + field + "']").append(this._createSortElement().addClass("e-" + (direction || "ascending") + " " + imageDirection));
            $headerCellDiv.parent().attr("aria-sort", direction);
        },
        _removeSortElementFromColumn: function (field) {
            var column = this.getColumnByField(field);
            var index = $.inArray(column, this.model.columns);
            var $headerCellDiv = this.getHeaderTable().find("thead").find(".e-headercell").not(".e-detailheadercell").eq(index).find(".e-headercelldiv");
            $headerCellDiv.find(".e-ascending,.e-descending").remove();
            $headerCellDiv.parent().removeAttr("aria-sort");
        },
        _sortCompleteAction: function (args) {
            var imageDirection;
            this.getHeaderTable().find(".e-columnheader").find(".e-headercelldiv")
                    .find(".e-ascending,.e-descending,.e-number").remove();
            if (this.model.allowGrouping && this.model.groupSettings.groupedColumns.length != 0)
                this.element.find(".e-groupdroparea").find("div[ej-mappingname='" + args.columnName + "']").find(".e-ascending,.e-descending,.e-number").not(".e-ungroupbutton").remove();
            this.getHeaderTable().find("[aria-sort]").removeAttr("aria-sort");
            for (var i = 0; i < this.model.sortSettings.sortedColumns.length; i++)
                this._addSortElementToColumn(this.model.sortSettings.sortedColumns[i].field, this.model.sortSettings.sortedColumns[i].direction);
            if (this.model.groupSettings.groupedColumns.length && this._$curSElementTarget != null) {
                var $element = this._checkEinGroupDrop($.trim(this._$curSElementTarget.attr("ej-mappingname")));
                if (!ej.isNullOrUndefined($element)) {
                    imageDirection = (ej.isNullOrUndefined(args.columnSortDirection) || args.columnSortDirection == "" ? this.getsortColumnByField(this._$curSElementTarget.attr("ej-mappingname")).direction.toLowerCase() : args.columnSortDirection) == "ascending" ? "e-rarrowup-2x" : "e-rarrowdown-2x"
                    $element.find(".e-ascending,.e-descending").removeClass().addClass("e-icon e-" + (ej.isNullOrUndefined(args.columnSortDirection) || args.columnSortDirection == "" ? this.getsortColumnByField(this._$curSElementTarget.attr("ej-mappingname")).direction.toLowerCase() : args.columnSortDirection) + " " + imageDirection);
                }
            }
            this.multiSortRequest = false;
            this.setWidthToColumns();
        },
        
        removeSortedColumns: function (fieldName) {
            if ($.isArray(fieldName)) {
                for (var i = 0; i < fieldName.length; i++) {
                    this._removeSortedColumnFromCollection(fieldName[i]);
                }
            }
            else
                this._removeSortedColumnFromCollection(fieldName);
            this.multiSortRequest = true;
            this.sortColumn(null, null);
        },
        _removeSortedColumnFromCollection: function (fieldName) {
            for (var i = 0; i < this.model.sortSettings.sortedColumns.length; i++) {
                if (this.model.sortSettings.sortedColumns[i].field == fieldName) {
                    this.model.sortSettings.sortedColumns.splice(i, 1);
                    break;
                }
            }
        },
        
        clearSorting: function () {
            var proxy = this;
            this.model.sortSettings.sortedColumns = $.grep(this.model.sortSettings.sortedColumns, function (value, index) {
                if ($.inArray(value.field, proxy.model.groupSettings.groupedColumns) != -1)
                    return true;
                return false;
            });
            this._$prevSElementTarget = null;
            this._$curSElementTarget = null;
            this.refreshContent();
        },
        
        sortColumn: function (columnName, columnSortDirection) {
            if (!this.model.allowSorting || $.inArray(columnName, this._disabledSortableColumns) != -1 || (columnName != null && columnName.length == 0))
                return;
            var args = {};
            if (!this.multiSortRequest) {
                var proxy = this;
                this.model.sortSettings.sortedColumns = $.grep(this.model.sortSettings.sortedColumns, function (value, index) {
                    if ($.inArray(value.field, proxy.model.groupSettings.groupedColumns) != -1)
                        return true;
                    return false;
                });
            }
            args.requestType = ej.Grid.Actions.Sorting;
            this._cSortedColumn = args.columnName = columnName;
            this._cSortedDirection = args.columnSortDirection = ej.isNullOrUndefined(columnSortDirection) ? ej.sortOrder.Ascending : columnSortDirection.toLowerCase();
            if (this._cSortedColumn !== null) {
                this._removeSortedColumnFromCollection(columnName);
                this.model.sortSettings.sortedColumns.push({ field: this._cSortedColumn, direction: this._cSortedDirection });
            }
            var returnValue = this._processBindings(args);
            if (returnValue)
                this._cSortedDirection = this._cSortedColumn = null;
            this._primaryKeyValues = [];
        },
        _createSortElement: function () {
            return ej.buildTag('span.e-icon', "&nbsp;");
        },
        _renderMultiTouchDialog: function () {
            this._customPop = ej.buildTag("div.e-gridpopup", "", { display: "none" });
            var $content = ej.buildTag("div.e-content"), $downTail = ej.buildTag("div.e-downtail e-tail");
            if (this.model.allowMultiSorting) {
                var $selElement = ej.buildTag("span.e-sortdirect e-icon");
                $content.append($selElement);
            }
            if (this.model.selectionType == "multiple") {
                var $selElement = ej.buildTag("span.e-rowselect e-icon");
                $content.append($selElement);
            }
            this._customPop.append($content);
            this._customPop.append($downTail);
            this.element.append(this._customPop);
        },

    };
})(jQuery, Syncfusion);;
(function ($, ej, undefined) {
    ej.gridFeatures = ej.gridFeatures || {};
    ej.gridFeatures.filter = {
        
        getFilterBar: function () {
            return this._gridFilterBar;
        },

        setGridFilterBar: function (value) {
            this._gridFilterBar = value;
        },
        
        filterColumn: function (fieldName, filterOperator, filterValue, predicate, matchcase, actualFilterValue, actualOperator) {
            if (!this.model.allowFiltering)
                return;
            var column = this.getColumnByField(fieldName), _format;
            if(!ej.isNullOrUndefined(column) && !ej.isNullOrUndefined(column.filterBarTemplate) && column.type == "boolean" && filterValue == "true" || filterValue == "false")
				filterValue = JSON.parse(filterValue);
            if (!ej.isNullOrUndefined(column) && !ej.isNullOrUndefined(column.filterBarTemplate) && (column.type == "date" || column.type == "datetime") && filterValue.length > 0) {

                if (ej.isNullOrUndefined(column.format)) {
                    if (this._currentFilterColumn.type == "date")
                        _format = ej.preferredCulture().calendar.patterns.d; //System Date format
                    else
                        _format = ej.preferredCulture().calendar.patterns.f; //System DateTime format
                }
                else
                    _format = column.format.replace("{0:", "").replace('}', "");
                filterValue = ej.parseDate(filterValue, _format, this.model.locale);
            }
            var filterCollection = [];
            if (typeof (fieldName) == "object")
                filterCollection = fieldName;
            else
                filterCollection.push({ field: fieldName, operator: filterOperator, value: filterValue, predicate: predicate, matchcase: matchcase, actualFilterValue: actualFilterValue });

            for (var i = 0; i < filterCollection.length; i++) {
                var fieldName = filterCollection[i].field, filterOperator = filterCollection[i].operator,
                filterValue = filterCollection[i].value, predicate = filterCollection[i].predicate,
                matchcase = !ej.isNullOrUndefined(filterCollection[i].matchcase) ? filterCollection[i].matchcase : false, actualFilterValue = filterCollection[i].actualFilterValue;
                var args = {};
                args.requestType = ej.Grid.Actions.Filtering;
                args.currentFilterObject = [];
                this._$curFieldName = fieldName;
                if (!$.isArray(filterOperator))
                    filterOperator = $.makeArray(filterOperator);
                if (!$.isArray(filterValue))
                    filterValue = $.makeArray(filterValue);
                if (!$.isArray(predicate))
                    predicate = $.makeArray(predicate);
                var firstLoop = false;
                var filterCol = this._filterCollection;
                if (ej.util.isNullOrUndefined(this._currentFilterColumn))
                    this._currentFilterColumn = this.getColumnByField(fieldName);
                for (var index = 0; index < filterOperator.length; index++) {
                    var filterObject = {
                        field: fieldName,
                        operator: filterOperator[index],
                        value: filterValue[index],
                        matchcase: matchcase,
                        predicate: predicate[index],
                        actualFilterValue: ej.getObject("value", actualFilterValue),
                        actualOperator: ej.getObject("operator", actualFilterValue)
                    };
                    predicated = ej.getObject("ejpredicate", actualFilterValue);
                    if (predicated)
                        filterObject = predicated;
                    if (this.model.filterSettings.filterType == "filterbar")
                        this._$colType = this._currentFilterColumn.type;
                    if (this.model.filterSettings.filteredColumns.length == 0 && filterObject.value !== "") {
                        if ((this._$colType == "date" || this._$colType == "datetime") && (filterOperator == "equal" || filterOperator == "notequal") && typeof (filterObject.value) !== "string")
                            this._setDateFilters(filterObject);
                        else
                            this.model.filterSettings.filteredColumns.push(filterObject);
                    } else {
                        var proxy = this;
                        if (!firstLoop) {
                            var dataManger = ej.DataManager(this.model.filterSettings.filteredColumns);
                            var query = new ej.Query().where("field", ej.FilterOperators.equal, filterObject.field);
                            var object = dataManger.executeLocal(query);
                            for (var j = 0; j < object.length; j++) {
                                var objectIndex = $.inArray(object[j], this.model.filterSettings.filteredColumns)
                                if (objectIndex != -1)
                                    this.model.filterSettings.filteredColumns.splice(objectIndex, 1);
                            }
                        }
                        if (filterObject.value !== "") {
                            if ((this._$colType == "date" || this._$colType == "datetime") && (filterOperator == "equal" || filterOperator == "notequal") && typeof (filterObject.value) !== "string")
                                this._setDateFilters(filterObject);
                            else
                                this.model.filterSettings.filteredColumns.push(filterObject);
                        }
                    }
                    firstLoop = true;
                    args.currentFilterObject.push(filterObject);
                }
                args.filterCollection = this.model.filterSettings.filteredColumns;
                args.currentFilteringColumn = fieldName;
                var returnValue = this._processBindings(args);
                if (returnValue) {
                    this.model.filterSettings.filteredColumns.reverse().splice(0, filterOperator.length);
                    this.model.filterSettings.filteredColumns.reverse();
                }
                if (!ej.isNullOrUndefined(column) && !ej.isNullOrUndefined(column.filterBarTemplate)) {
					this.filterStatusMsg = "";
					if(this._oldFilterColumn != column &&  (this.filterColumnCollection.length > 0 && $.inArray(column,this.filterColumnCollection) == -1 ))
					this.filterColumnCollection.push(column);
					this._oldFilterColumn = this._currentFilterColumn = column;
					this._showFilterMsg();
				}
            }
        },
        
        search: function (searchString) {
            var args = {};
            if ($("#" + this._id + "_search").find("input").val() != searchString);
                $("#" + this._id + "_search").find("input").val(searchString);
            args.requestType = ej.Grid.Actions.Search;
            args.keyValue = searchString;
            if (searchString != "" || this.model.searchSettings.key != "") {                
                this.model.searchSettings.key = searchString.toLowerCase() == this.localizedLabels.True.toLowerCase() ? "true" : searchString.toLowerCase() == this.localizedLabels.False.toLowerCase() ? "false" : searchString;
                this._processBindings(args);
            }
            this._primaryKeyValues = [];
        },
        _filterBarHandler: function (e) {
            var keycode = e.keyCode, $target = $(e.target);
            if ($target.closest(".e-grid").attr("id") !== this._id)
                return;
            if ((this.model.filterSettings["filterBarMode"] == "immediate" || keycode == 13) && keycode != 9) {
                var $target = $(e.target);
                this.filterStatusMsg = "";
                var fieldName = $target.prop("id").replace("_filterBarcell", "");
                var column = this.getColumnByField(fieldName);
                if (column == null)
                    return;
                this._currentFilterColumn = column;
                this._$curFieldName = column.field;
                if (this._currentFilterColumn != this._oldFilterColumn)
                    this.filterValueOldLength = 0;				
                this._currentFilterbarValue = $target.val().toLowerCase() == this.localizedLabels.True.toLowerCase() ? "true" : $target.val().toLowerCase() == this.localizedLabels.False.toLowerCase() ? "false" : $target.val();
                this.filterValueCurrentLength = this._currentFilterbarValue.length;
                if (((this.filterValueCurrentLength == 0 && this.filterValueOldLength == 0) || this._currentFilterbarValue == this.OldfilterValue) && this._currentFilterColumn == this._oldFilterColumn && !this.model.scrollSettings.enableVirtualization) {
                    this._showFilterMsg();
                    return;
                }
                this._skipFilterProcess = this._checkForSkipInput();
                if (!this._skipFilterProcess) {
                    this._processFilter(e);
                } else {
                    if (this._currentFilterColumn.type == "string") {
                        this.filterStatusMsg = "Invalid Filter Data";
                        this._showFilterMsg();
                    } else {
                        this._skipFilterProcess = false;
						if(!this.model.scrollSettings.enableVirtualization)
							this._showFilterMsg();
                        return;
                    }
                }
            }
        },
        _renderResponsiveFilter: function () {
            var $outerDiv = ej.buildTag('div#responsiveFilter.resFilterDiv', '', { 'width': '100%', 'padding': '0px' });
            var height = $(window).height() + 1;
            var headerHieght = height * (8 / 100);
            var width = this.element.height() > height ? $(window).width() + 16.5 : $(window).width();
            var $columnDiv = ej.buildTag('div.columnDiv', '', { width: '100%' });
            for (var i = 0; i < this.model.columns.length; i++) {
                var $cDiv = ej.buildTag('div.e-responsivefilterColDiv', '', { width: '100%' }, { 'ej-MappingName': this.model.columns[i].field });
                var $span = ej.buildTag('span', this.model.columns[i].headerText, { 'margin-left': '4%' });
                $cDiv.append($span);
                $columnDiv.append($cDiv);
            }
            $outerDiv.append($columnDiv);
            this.element.append($outerDiv);
            var gridObj = this;
            var widt = this.element.outerWidth();
            var $headerDiv = ej.buildTag('div.e-resFilterDialogHeaderDiv', '', { 'height': headerHieght });
            var $span = ej.buildTag('div.labelRes', '<span>Filter</span>');
            var $resIcon = ej.buildTag('div.e-resFilterleftIcon', '', { 'margin-top': '3%' });
            var $resspan = ej.buildTag('span.e-icon e-responsiveFilterClear e-resIcon', '', { 'font-size': '23px' });
            var $divIcon = ej.buildTag('div.e-resFIlterRigthIcon', '', { 'float': 'right', 'margin-top': '3%' }, { closeDialogue: 'responsiveFilter', gridEle: true });
            var $spanIcon = ej.buildTag('span.e-icon e-responisveClose e-resIcon', '', { 'font-size': '23px' }, { closeDialogue: 'responsiveFilter', gridEle: true });
            $divIcon.click(function (e) {
                $("#responsiveFilter").css('display', 'none');
                gridObj.element.css('display', 'block');
            });
            $resIcon.click(function (e) {
                $("#responsiveFilter").find('.e-responsivefilterColDiv').find('.e-filternone').click();
            });
            $headerDiv.append($resIcon.append($resspan));
            $headerDiv.append($span).append($divIcon.append($spanIcon));
            $outerDiv.prepend($headerDiv);
            $outerDiv.insertAfter(this.element);
            $(".resFilterDiv").bind('keydown', $.proxy(this._responsiveDialogueKeyUp, this))
            $outerDiv.css('display', 'none');
            $(".e-responsivefilterColDiv").bind('click', $.proxy(this._mouseClickHandler, this));
        },
        _closeDivIcon: function (sender) {
            var $div = $(sender.target);
            if (!ej.isNullOrUndefined($div.attr('closeDialogue'))) {
                var $dialog = $("#" + $div.attr('closeDialogue'));
                if (!ej.isNullOrUndefined($dialog.data('ejDialog')))
                    $dialog.ejDialog('close');
                else
                    $dialog.css('display', 'none');
            }
            if (!ej.isNullOrUndefined($div.attr('gridEle'))) {
                this.element.css('display', 'block');
            }
            if (!ej.isNullOrUndefined($div.attr('openDialogue'))) {
                if (this.model.enableResponsiveRow || $div.attr('closeDialogue').indexOf('Custom') != -1) {
                    var $dialog = $("#" + $div.attr('openDialogue'));
                    if (!ej.isNullOrUndefined($dialog.data('ejDialog')))
                        $dialog.ejDialog('open');
                    else
                        $dialog.css('display', 'block');
                }
                else
                    this.element.css('display', 'block');
            }
        },
        _setResponsiveFilterIcon: function () {
            var $div = $("#responsiveFilter").find('.columnDiv'), $proxy = this;
            $div.find('.e-filtericon').remove();
            for (var i = 0; i < this.model.filterSettings.filteredColumns.length; i++) {
                var column = this.model.filterSettings.filteredColumns[i];
                var $selcDiv = $div.find('.e-responsivefilterColDiv[ej-MappingName=' + column.field + ']');
                var $divIcon = ej.buildTag('div.e-filtericon e-icon e-resIcon e-filterset e-filternone e-filterreset', '', { float: 'right', height: '22px', width: '21px', 'font-size': '20px', 'margin-right': '3%', 'margin-top': '2%' });
                var $iconSapn = ej.buildTag('span.e-filtericon e-icon e-resIcon e-filterset e-filternone', '', {}, { 'colType': column.type });
                $selcDiv.find('.e-filternone').remove();
                $selcDiv.append($divIcon);
                $iconSapn.click(function (e) {
                    var $target = e.target;
                    $proxy._$colType = $target.attr('colType');
                    $proxy._fltrClrHandler();
                    $target.remove();
                })
            }
        },
        _renderExcelFilter: function () {
            var filterCol = this.model.filterSettings.filteredColumns.length != 0 ? this.model.filterSettings.filteredColumns[0].field : null;
            var model = {
                instance: this,
                showSortOptions: this.model.allowSorting,
                allowFormatFiltering: this.model.filterSettings.allowFormatFiltering,
                allowCaseSensitive: this.model.filterSettings.enableCaseSensitivity,
                maxFilterLimit: this.model.filterSettings.maxFilterChoices,
                interDeterminateState: this.model.filterSettings.enableInterDeterminateState,
                enableComplexBlankFilter: this.model.filterSettings.enableComplexBlankFilter,
                blankValue: this.model.filterSettings.blankValue,
                filterHandler: ej.proxy(this._filterHandler, this),
                initFilterCol: filterCol,
                actionBegin: "actionBegin",
                actionComplete: "actionComplete"
            };
            this._excelFilter = new ej.excelFilter(model);
            $.extend(this._excelFilter, this.model.filterSettings);
        },
        _filterHandler: function (args) {
            var arg = {}, fQMgr;
            arg.requestType = args.action == "sorting" ? args.action : "filtering";
            var temp = this.model.filterSettings.filteredColumns;
            if (args.action == "filtering") {
                fQMgr = ej.DataManager(this.model.filterSettings.filteredColumns);
                var query = new ej.Query().where("field", ej.FilterOperators.equal, args.fieldName);
                var object = fQMgr.executeLocal(query);
                for (var i = 0; i < object.length; i++) {
                    var objectIndex = $.inArray(object[i], this.model.filterSettings.filteredColumns)
                    if (objectIndex != -1)
                        this.model.filterSettings.filteredColumns.splice(objectIndex, 1);
                }
                ej.merge(this.model.filterSettings.filteredColumns, args.filterCollection);
                args.currentFilterCollection = args.filterCollection;
            }
            else if (args.action == "clearfiltering") {
                var filterObj = args.filterDetails;
                delete this._excelFilter._predicates[0][args.fieldName];
                this.filterColumn(filterObj.field, filterObj.operator, filterObj.value, filterObj.predicate);
                return;
            }
            else if (args.action == "sorting") {
                var sortObj = args.sortDetails;
                if (ej.gridFeatures.sort)
                    this.sortColumn(sortObj.field, sortObj.direction);
                this._excelFilter.closeXFDialog();
                return;
            }

            arg.currentFilteringColumn = args.fieldName;
            arg.predicated = args.ejpredicate;
            var returnValue = this._processBindings(arg);
            if (returnValue)
                this.model.filterSettings.filteredColumns = temp;
        },
        _renderFiltering: function () {
            var $headerTable = this.getHeaderTable(),args,temp;
            var $tr = ej.buildTag('tr.e-filterbar'), $trClone, filteredFields = [],$input;
            if (this.model.detailsTemplate || this.model.childGrid) $tr.append(ej.buildTag('th.e-filterbarcell e-mastercell'));
            for (var column = 0; column < this.model.columns.length; column++) {
                var $th = ej.buildTag('th.e-filterbarcell'), $div = ej.buildTag('div.e-filterdiv'), $span = ej.buildTag('span.e-cancel e-icon e-hide');
                if (this.model.columns[column]["allowFiltering"] != false && !ej.isNullOrUndefined(this.model.columns[column].filterBarTemplate)) {
                    $th.addClass('e-fltrtemp');
                    $div.addClass('e-fltrtempdiv');
                    if (ej.isNullOrUndefined(this.model.columns[column].filterBarTemplate.create)) {
                        $input = ej.buildTag('input e-filtertext', "", {}, { title: this.model.columns[column]["headerText"] + this.localizedLabels.FilterbarTitle, id: this.model.columns[column]["field"] + "_filterBarcell", "class": "e-filterUi_input e-filtertext e-fltrTemp" });
                    }
                    else {
                        args = { columnIndex: column, column: this.model.columns[column] }
                        temp = this.model.columns[column].filterBarTemplate.create;
                        if (typeof temp == "string")
                            temp = ej.util.getObject(temp, window);
                        $input = temp(args)
                        $input = $($input).attr({ title: this.model.columns[column]["headerText"] + this.localizedLabels.FilterbarTitle, id: this.model.columns[column]["field"] + "_filterBarcell", "class": "e-filterUi_input e-filtertext e-fltrTemp" });
                    }
                }
                else{
					$div.addClass('e-fltrinputdiv');
                    $input = ej.buildTag('input.e-ejinputtext e-filtertext', "", {}, { title: this.model.columns[column]["headerText"] + this.localizedLabels.FilterbarTitle, type: "search", id: this.model.columns[column]["field"] + "_filterBarcell" });
				}
                if (this.model.filterSettings.filteredColumns.length > 0 && this.model.filterSettings.filterType == "filterbar" && $.inArray(this.model.columns[column].field, filteredFields) == -1) {
                    for (var fColumn = 0; fColumn < this.model.filterSettings.filteredColumns.length; fColumn++) {
                        if (this.getColumnIndexByField(this.model.filterSettings.filteredColumns[fColumn].field) == column) {
                            if (this.model.filterSettings.filteredColumns[fColumn].operator == "greaterthan")
                                $input.val(">" + this.model.filterSettings.filteredColumns[fColumn].value);
                            else if (this.model.filterSettings.filteredColumns[fColumn].operator == "lessthan")
                                $input.val("<" + this.model.filterSettings.filteredColumns[fColumn].value);
                            else if (this.model.filterSettings.filteredColumns[fColumn].operator == "notequal")
                                $input.val("!=" + this.model.filterSettings.filteredColumns[fColumn].value);
                            else
                                $input.val(this.model.filterSettings.filteredColumns[fColumn].value);
                            if ($.inArray(this.model.filterSettings.filteredColumns[fColumn].field, filteredFields) == -1) filteredFields.push(this.model.filterSettings.filteredColumns[fColumn].field);
                        }
                    }
                }
                if (this.model.columns[column]["allowFiltering"] === false || this.model.columns[column]["field"] == "" || ej.isNullOrUndefined(this.model.columns[column]["field"])) {
                    $input.attr("disabled", true).addClass("e-disable");
                    this._disabledFilterableColumns.push(this.model.columns[column]["headerText"]);
                }
                this.model.columns[column]["visible"] === false && $th.addClass("e-hide");
                !ej.isNullOrUndefined(this.model.columns[column]["cssClass"]) && $th.addClass(this.model.columns[column]["cssClass"]);
                if (this.model.columns[column]["allowFiltering"] != false && !ej.isNullOrUndefined(this.model.columns[column].filterBarTemplate))
                    $div.append($input);
                else
                $div.append($input).append($span);
                $tr.append($th.append($div));
                if (column == this.model.scrollSettings.frozenColumns - 1) {
                    $trClone = $tr.clone();
                    $headerTable.find("thead").first().append($trClone);
                    $tr.empty();
                }
            }
            $headerTable.find("thead").last().append($tr);
			if (ej.browserInfo().name == "msie" && ej.browserInfo().version < 10) {
                var filterBarCell = $headerTable.find("thead").find(".e-ejinputtext.e-filtertext");
                for (var cell = 0; cell < filterBarCell.length; cell++)
                    ej.ieClearRemover(filterBarCell[cell]);
            }
            this.setGridFilterBar($tr);
        },
        _renderFilterBarTemplate: function () {
            var args, temp1, temp2,flag = false;
            for (var count = 0 ; count < this.model.columns.length; count++) {
                if (this.model.columns[count]["allowFiltering"] != false && !ej.isNullOrUndefined(this.model.columns[count].filterBarTemplate)) {
                    temp1 = this.model.columns[count].filterBarTemplate.read;
                    if (typeof temp1 == "string")
                        temp1 = ej.util.getObject(temp1, window);
                    args = { element: this.getHeaderTable().find('.e-filterbar').find('.e-fltrtemp').find("#" + this.model.columns[count].field + "_filterBarcell"), columIndex: count, column: this.model.columns[count] }
                    if (typeof args.column.filterBarTemplate.read == "string")
                        args.column.filterBarTemplate.read = temp1;
                    temp2 = this.model.columns[count].filterBarTemplate.write;
                    if (typeof temp2 == "string")
                        temp2 = ej.util.getObject(temp2, window);
                    temp2.call(this, args);
					flag = true
                }
            }
			if(flag)
            this.model.filterSettings.filterBarMode = ej.Grid.FilterBarMode.OnEnter;
        },
        _closeFilterDlg: function () {
            if (!ej.isNullOrUndefined($("#" + this._id + "_" + this._$colType + "Dlg").data('ejDialog')))
                $("#" + this._id + "_" + this._$colType + "Dlg").ejDialog('close');
            else
                $("#" + this._id + "_" + this._$colType + "Dlg").css('display', 'none');
            this._$fDlgIsOpen = false;
            this._$menuDlgIsOpen = false;
        },
        _filterBarClose: function (e) {
            var $target = $(e.target);
            if ($target.closest(".e-grid").attr("id") !== this._id)
                return;
            if (e.type == "click" && $target.hasClass("e-cancel")) {
                var $targetText = $target.prev();
                $targetText.focus().val("");
                $targetText.trigger("keyup");
                e.stopPropagation();
            }
            if (e.type == "focusin" && $target.hasClass("e-filtertext")) {
                $target = $(e.target).next();
                this.getFilterBar().find(".e-cancel").addClass("e-hide");
                $target.removeClass("e-hide");
            }
        },
        _processFilter: function (e) {
            if (!this._alreadyFilterProcessed) {
                this._alreadyFilterProcessed = true;
                this._startTimer(e);
            } else {
                this._stopTimer();
                this._startTimer(e);
            }
        },
        _startTimer: function (e) {
            var proxy = this;
            var delay = e.keyCode == 13 ? 0 : proxy.model.filterSettings.immediateModeDelay;
            this._timer = window.setTimeout(
                function () {
                    proxy._onTimerTick();
                },
                delay);
        },
        _stopTimer: function () {
            if (this._timer != null)
                window.clearTimeout(this._timer);
        },

        _onTimerTick: function () {
            this.OldfilterValue = this._currentFilterbarValue;
            this._oldFilterColumn = this._currentFilterColumn;
            this.filterValueOldLength = this.filterValueCurrentLength;
            this._findPredicate();
            var result = null;
            var matchcase = this._currentFilterColumn.type == "string" ? false : true;            
            var collection = $.extend([], this.model.filterSettings.filteredColumns);
            for (var i = 0; i < collection.length; i++) {
                if (this.getHeaderContent().find(".e-filterbar #" + collection[i].field + "_filterBarcell").val() == "") {
                        if ($.inArray(this.model.filterSettings.filteredColumns[i], this.filterColumnCollection) != -1)
                            this.filterColumnCollection.splice(i, 1);
                        this.model.filterSettings.filteredColumns.splice(i, 1);
                }
            }
			if (this._currentFilterColumn.type == "date" || this._currentFilterColumn.type == "datetime") {
                for (var j = 0; j < this.model.filterSettings.filteredColumns.length; j++) {
                    if (this.model.filterSettings.filteredColumns[j].isComplex) {
                        var preobject = this.model.filterSettings.filteredColumns[j].predicates;
                        if (this.model.filterSettings.filteredColumns.length == 1) {
                           this.model.filterSettings.filteredColumns = preobject;
                        }
                        else {
                            this.model.filterSettings.filteredColumns[j] = preobject[0];
                            this.model.filterSettings.filteredColumns.push(preobject[1]);
                        }
                    }
                }
            }
            if (!this._skipFilterProcess) {
                if (this._currentFilterColumn.foreignKeyValue && this._currentFilterColumn.dataSource && this._currentFilterbarValue != "")
                    this._fltrForeignKeyValue(this._operator, this._currentFilterbarValue, matchcase,
                                              this._currentFilterColumn.dataSource, this._currentFilterColumn.foreignKeyField,
                                              this._currentFilterColumn.foreignKeyValue, this._currentFilterColumn.type);
                else{
						if(ej.isNullOrUndefined(this._currentFilterColumn.filterBarTemplate))
						this.filterColumn(this._currentFilterColumn.field, this._operator, this._currentFilterbarValue, this._predicate, matchcase);
					}
            }
            else
                this.filterStatusMsg = "Invalid Filter Data";
            if(!this.model.scrollSettings.enableVirtualization && ej.isNullOrUndefined(this._currentFilterColumn.filterBarTemplate))
				this._showFilterMsg();
            this._stopTimer();
        },

        _findPredicate: function () {
            var _value = this._currentFilterbarValue.replace(/ && /i, " and ").replace(" || ", " or ");
            var _predicateFinder = _value.split(' ');
            this._predicate = "and";
            if (_predicateFinder.length != 0) {
                if ($.isFunction(ej.Predicate[_predicateFinder[1]])) {
                    this._skipFilterProcess = false;
                    this._predicate = _predicateFinder[1];
                    var valuesArray = _value.split(" " + _predicateFinder[1] + " ");
                    var tempOperator = [];
                    var filterValues = [];
                    for (var i = 0; i < valuesArray.length; i++) {
                        this._validateFilterValue(valuesArray[i]);
                        tempOperator.push(this._operator);
                        if (this._currentFilterColumn.type == "number")
                            filterValues.push(this._currentFilterbarValue);
                        else if (this._currentFilterColumn.type == "string")
                            filterValues.push(valuesArray[i]);
                    }
                    this._currentFilterbarValue = filterValues;
                    this._operator = tempOperator;
                } else
                    this._validateFilterValue($.trim(this._currentFilterbarValue));
            } else
                this._validateFilterValue($.trim(this._currentFilterbarValue));
        },

        _validateFilterValue: function (_value) {
            switch (this._currentFilterColumn.type) {
                case "number":
                    this._operator = ej.FilterOperators.equal;
                    var stringSkipInput = new Array(">", "<", "=", "!");
                    for (var i = 0; i < _value.length; i++) {
                        if (jQuery.inArray(_value[i], stringSkipInput) != -1) {
                            break;
                        }
                    }
                    if (i != _value.length) {
                        this._getOperator(_value.substring(i));
                        if (i != 0)
                            this._currentFilterbarValue = _value.substring(0, i);
                    }
                    if (this._currentFilterbarValue != "" && _value.length >= 1)
                        this._currentFilterbarValue = ej.parseFloat(this._currentFilterbarValue, this.model.locale);
                    else
                        this._currentFilterbarValue = _value.length > 1 ? ej.parseFloat(_value, this.model.locale) : _value;
                    break;
                case "date":
                case "datetime":
                    this._operator = ej.FilterOperators.equal;
                    this._getOperator(_value);
                    var _format;
                    if (ej.isNullOrUndefined(this._currentFilterColumn.format)) {
                        if (this._currentFilterColumn.type == "date")
                            _format = ej.preferredCulture().calendar.patterns.d; //System Date format
                        else
                            _format = ej.preferredCulture().calendar.patterns.f; //System DateTime format
                    }
                    else
                        _format = this._currentFilterColumn.format.replace("{0:","").replace('}', "");
                    if (this._currentFilterbarValue != "") {
                        var filterbarValue = ej.parseDate(this._currentFilterbarValue, _format, this.model.locale);
                        if (!ej.isNullOrUndefined(filterbarValue))
                            this._currentFilterbarValue = ej.parseDate(this._currentFilterbarValue, _format, this.model.locale);
                        else
                            this.filterStatusMsg = "Invalid Filter Data";
                    }
                    break;
                case "string":
                    if (_value.charAt(0) == '*') {
                        this._currentFilterbarValue = this._currentFilterbarValue.slice(1);
                        this._operator = ej.FilterOperators.startsWith;
                    }
                    else if (_value.charAt(_value.length - 1) == '%') {
                        this._currentFilterbarValue = this._currentFilterbarValue.slice(0, -1);
                        this._operator = ej.FilterOperators.startsWith;
                    }
                    else if (_value.charAt(0) == '%') {
                        this._currentFilterbarValue = this._currentFilterbarValue.slice(1);
                        this._operator = ej.FilterOperators.endsWith;
                    }
                    else
                        this._operator = ej.FilterOperators.startsWith;
                    break;
                case "boolean":
                    if (this._currentFilterbarValue.toLowerCase() == "true" || this._currentFilterbarValue == "1")
                        this._currentFilterbarValue = true;
                    else if (this._currentFilterbarValue.toLowerCase() == "false" || this._currentFilterbarValue == "0")
                        this._currentFilterbarValue = false;
                    this._operator = ej.FilterOperators.equal;
                    break;
                default:
                    this._operator = ej.FilterOperators.equal;
            }
        },
        _getOperator: function (_value) {
            if (_value.charAt(0) == "=") {
                this._operator = ej.FilterOperators.equal;
                this._currentFilterbarValue = _value.substring(1);
            }
            if (ej.data.operatorSymbols[_value.charAt(0)] !== undefined || ej.data.operatorSymbols[_value.slice(0, 2)] !== undefined) {
                this._operator = ej.data.operatorSymbols[_value.charAt(0)];
                this._currentFilterbarValue = _value.substring(1);
                if (this._operator === undefined) {
                    this._operator = ej.data.operatorSymbols[_value.slice(0, 2)];
                    this._currentFilterbarValue = _value.substring(2);
                }
            }
            if (this._operator == ej.FilterOperators.lessThan || this._operator == ej.FilterOperators.greaterThan) {
                if (this._currentFilterbarValue.charAt(0) == "=") {
                    this._operator = this._operator + "orequal";
                    this._currentFilterbarValue = this._currentFilterbarValue.substring(1);
                }
            }

        },

        _checkForSkipInput: function () {
            var isSkip = false;
            var skipInput = new Array("=", " ", "!");
            var context = this;
            if (this._currentFilterColumn.type == "number") {
                if (ej.data.operatorSymbols[this._currentFilterbarValue] !== undefined || $.inArray(this._currentFilterbarValue, skipInput) != -1)
                    isSkip = true;
            }
            if (this._currentFilterColumn.type == "string") {
                var stringSkipInput = new Array(">", "<", "=", "!");
                for (var i = 0; i < this._currentFilterbarValue.length; i++) {
                    if ($.inArray(this._currentFilterbarValue[i], stringSkipInput) != -1)
                        isSkip = true;
                }
            }
            return isSkip;
        },
        _showFilterMsg: function () {
            var index = $.inArray(this._currentFilterColumn, this.filterColumnCollection);
            if (this._currentFilterbarValue !== "" && index == -1)
                this.filterColumnCollection.push(this._currentFilterColumn);
            if (this._currentFilterbarValue === "" && index != -1) {
                this.filterColumnCollection.splice(index, 1);
            }
            if ((!this._skipFilterProcess || this.filterColumnCollection.length > 0) && this.filterStatusMsg != "Invalid Filter Data") {
                for (var index = 0; index < this.filterColumnCollection.length; index++) {
                    var val, filterColumnName, hTxt = this.filterColumnCollection[index].headerText;
                    if (this.filterColumnCollection[index].disableHtmlEncode)
                        hTxt = this._htmlEscape(hTxt);
                    if (this.filterColumnCollection[index].field.indexOf('.') != -1) {
                        var spltClmn = (this.filterColumnCollection[index].field).split(".");
                        filterColumnName = spltClmn.join("\\.");
                        val = $("#" + filterColumnName + "_filterBarcell").val();
                    }
                    else
                       	 { 
							if(this._currentFilterColumn.type == "boolean" && !ej.isNullOrUndefined(this._currentFilterColumn.filterBarTemplate) && this.element.find("#" + this.filterColumnCollection[index].field + "_filterBarcell").hasClass('e-checkbox e-js')) 
								val = this.element.find("#" + this.filterColumnCollection[index].field + "_filterBarcell").parent().attr('aria-checked');
							else
								val = this.element.find("#" + this.filterColumnCollection[index].field + "_filterBarcell").val();
						}	   
                    if (val != "") {
                        if (index > 0 && this.filterStatusMsg != "")
                            this.filterStatusMsg += " && ";
                        this.filterStatusMsg += hTxt + ": " + val;
                    }
                }
            }

            if (this.model.allowPaging)
                this.getPager().ejPager("model.externalMessage", this.filterStatusMsg);
            else {
                if (this.model.scrollSettings.allowVirtualScrolling)
                    this.$pagerStatusBarDiv.find(".e-pagerfiltermsg").html(this.filterStatusMsg).css("display", "block");
                else
                    this.$pagerStatusBarDiv.find("div").html(this.filterStatusMsg);
                if (this.filterStatusMsg.length)
                    this.$pagerStatusBarDiv.css("display", "block");
                else
                    this.model.scrollSettings.allowVirtualScrolling ? this.$pagerStatusBarDiv.find(".e-pagerfiltermsg").hide() : this.$pagerStatusBarDiv.hide();
            }
            if (this.filterStatusMsg == "Invalid Filter Data") {
                index = $.inArray(this._currentFilterColumn, this.filterColumnCollection);
                this.filterColumnCollection.splice(index, 1);
            }
            this.filterStatusMsg = "";
        },
        _renderFilterDialogs: function () {
            var $strDlg, $numDlg, $boolDlg, $dateDlg, $datetimeDlg,$guidDlg;

            $.each(this.model.columns, ej.proxy(function (indx, col) {
                if (col.type == "string" && (!$strDlg || !ej.isNullOrUndefined(col.filterType))) {
                    if (ej.isNullOrUndefined(col.filterType))
                        $strDlg = true;
                    this._renderFilters(col);
                } else if (col.type == "guid" && (!$guidDlg || !ej.isNullOrUndefined(col.filterType))) {
                    if (ej.isNullOrUndefined(col.filterType))
                        $guidDlg = true;
                    this._renderFilters(col);
                } else if (col.type == "number" && (!$numDlg || !ej.isNullOrUndefined(col.filterType))) {
                    if (ej.isNullOrUndefined(col.filterType))
                        $numDlg = true;
                    this._renderFilters(col);
                } else if (col.type == "date" && (!$dateDlg || !ej.isNullOrUndefined(col.filterType))) {
                    if (ej.isNullOrUndefined(col.filterType))
                        $dateDlg = true;
                    this._renderFilters(col);
                } else if (col.type == "datetime" && (!$datetimeDlg || !ej.isNullOrUndefined(col.filterType))) {
                    if (ej.isNullOrUndefined(col.filterType))
                        $datetimeDlg = true;
                    this._renderFilters(col);
                } else if (col.type == "boolean" && (!$boolDlg || !ej.isNullOrUndefined(col.filterType))) {
                    if (ej.isNullOrUndefined(col.filterType))
                        $boolDlg = true;
                    this._renderFilters(col);
                }
            }, this));
        },
        _renderFilters: function (col) {
            if ((this._isExcelFilter && col.filterType != "menu") || col.filterType == "excel") {
                if (ej.isNullOrUndefined(this._excelFilter)) {
                    this._renderExcelFilter();
                    this._excelFilterRendered = true;
                }
                this._excelFilter.renderDialog(col.type);
            }
            else
                eval(this["_render" + col.type.substring(0, 1).toUpperCase() + col.type.substring(1) + "Dialog"](col));
        },
        _renderStringDialog: function () {
            var $id = this._id + "_stringDlg";
            if ($("#" + $id).length > 0) return;
            var $content = ej.buildTag("div#" + $id + ".e-dlgcontainer e-filterDialoge");
            $content.appendTo("body");
            this._renderDlgContent($content, "string");
            if (!this.model.isResponsive || !this._mediaStatus)
                this._renderFDialog($id);
        },
        _renderBooleanDialog: function () {
            var $id = this._id + "_booleanDlg";
            if ($("#" + $id).length > 0) return;
            var $content = ej.buildTag("div#" + $id + ".e-dlgcontainer e-filterDialoge");
            $content.appendTo("body");
            this._renderDlgContent($content, "boolean");
            if (!this.model.isResponsive || !this._mediaStatus) {
                this._renderFDialog($id);
                if (!this.model.filterSettings.showPredicate)
                    $("#" + $id).ejDialog({ minHeight: 90, width: "100%" });
                else
                    $("#" + $id).ejDialog({ minHeight: 136, width: "100%" });
            }
        },
		 _renderGuidDialog: function () {
            var $id = this._id + "_guidDlg";
            if ($("#" + $id).length > 0) return;
            var $content = ej.buildTag("div#" + $id + ".e-dlgcontainer e-filterDialoge");
            $content.appendTo("body");
            this._renderDlgContent($content, "guid");
            if (!this.model.isResponsive || !this._mediaStatus)
                this._renderFDialog($id);
        },
        _renderNumberDialog: function () {
            var $id = this._id + "_numberDlg";
            if ($("#" + $id).length > 0) return;
            var $content = ej.buildTag("div#" + $id + ".e-dlgcontainer e-filterDialoge");
            $content.appendTo("body");
            this._renderDlgContent($content, "number");
            if (!this.model.isResponsive || !this._mediaStatus)
                this._renderFDialog($id);
        },
        _renderDateDialog: function (col) {
            var $id = this._id + "_dateDlg";
            if ($("#" + $id).length > 0) return;
            var $content = ej.buildTag("div#" + $id + ".e-dlgcontainer e-filterDialoge");
            $content.appendTo("body");
            this._renderDlgContent($content, "date", col);
            if (!this.model.isResponsive || !this._mediaStatus)
                this._renderFDialog($id);
        },
        _renderDatetimeDialog: function (col) {
            var $id = this._id + "_datetimeDlg";
            if ($("#" + $id).length > 0) return;
            var $content = ej.buildTag("div#" + $id + ".e-dlgcontainer e-filterDialoge");
            $content.appendTo("body");
            this._renderDlgContent($content, "datetime", col);
            if (!this.model.isResponsive || !this._mediaStatus)
                this._renderFDialog($id);
        },
        _renderFDialog: function (id) {
            $("#" + id).ejDialog({ showOnInit: false, "enableRTL": this.model.enableRTL, "cssClass": this.model.cssClass, "showHeader": false, width: 260, enableResize: false, allowKeyboardNavigation: false, content: "#" + this._id });
        },
        _closeFDialog: function () {
            if (this._isExcelFilter || this._excelFilterRendered)
                this._excelFilter.closeXFDialog();
            if (this._$menuDlgIsOpen)
                this._closeFilterDlg();
        },
        _renderDlgContent: function (content, type, col) {
            content.addClass("e-grid");
            var $predicate = ej.buildTag("div.e-predicate"), $operator = ej.buildTag("div.e-operator"), $value = ej.buildTag("div.e-value");
            var $strOp = this.localizedLabels.StringMenuOptions;
            var $numOp = this.localizedLabels.NumberMenuOptions;
            var $drdown = ej.buildTag("input#" + this._id + type + "_ddinput", {}, {}, { "type": "text" });
            var $drdownDiv = ej.buildTag("div#" + this._id + type + "_dropdown");
            var $drdownUl = ej.buildTag("ul");
            var $radio = ej.buildTag("input", {}, {}, { "type": "radio", "name": this._id + "_predicate" + type, "value": "or" });
            var $andRadio = ej.buildTag("input", {}, {}, { "type": "radio", "name": this._id + "_predicate" + type, "value": "and", "checked": "checked" });
            var $cbox;
            $predicate.append($andRadio)
                .append(ej.buildTag("span.e-caption").html(this.localizedLabels.PredicateAnd))
                .append($radio)
                .append(ej.buildTag("span.e-caption").html(this.localizedLabels.PredicateOr));
            !this.model.filterSettings.showPredicate && $predicate.hide();
            if (type == "string") {
                $cbox = ej.buildTag("input", {}, {}, { "type": "checkbox" });
                $predicate.append($cbox)
                    .append(ej.buildTag("span.e-caption").html(this.localizedLabels.MatchCase));
                $.each($strOp, function (indx, operator) {
                    $drdownUl.append(ej.buildTag("li", {}, {}, { "value": operator.value }).html(operator.text));
                });
            }
            if (type == "number" || type == "date" || type == "datetime"|| type == "guid" ) {
                if(type=="guid")
                $numOp = $numOp.slice(4,6);
                $.each($numOp, function (indx, operator) {
                $drdownUl.append(ej.buildTag("li", {}, {}, { "value": operator.value }).html(operator.text));
                });
            }
            if (type != "boolean") {
                $drdownDiv.append($drdownUl);
                $operator.append($drdown);
                $operator.append($drdownDiv);
            }
            var $tBox = ej.buildTag("input", {}, {}, { "type": "text" });
            var $tchkBox = ej.buildTag("input", {}, {}, { "type": "checkbox" });
            var filterVal = this.model.enableResponsiveRow ? 'OkButton' : 'Filter';
            var clearVal = this.model.enableResponsiveRow ? 'CancelButton' : 'Clear';
            var $filter = ej.buildTag("input.e-filter", {}, {}, { "type": "button", "value":this.localizedLabels[filterVal] });
            var $clear = ej.buildTag("input.e-clear", {}, {}, { "type": "button", "value": this.localizedLabels[clearVal] });
            $value.append(ej.buildTag("span.e-caption").html(this.localizedLabels.FilterMenuCaption + " : "));
            content.append($predicate);
            if (type == "boolean") {
                $value.find("span.e-caption").css("top","1px");
                $value.append($tchkBox);
            }
            else {
                $value.append(ej.buildTag("br")).append($tBox);
                content.append($operator);
            }
            content.append($value);
            content.append(ej.buildTag("div.e-dlgBtns").append($filter)
                .append($clear));
            if (type != "boolean")
                $drdown.ejDropDownList({ "cssClass": this.model.cssClass, "enableRTL": this.model.enableRTL, "targetID": this._id + type + "_dropdown", width: "100%", height: "26px", selectedItemIndex: 0 });
            $radio.ejRadioButton({ "cssClass": this.model.cssClass, "enableRTL": this.model.enableRTL });
            $andRadio.ejRadioButton({ "cssClass": this.model.cssClass, "enableRTL": this.model.enableRTL, checked: true });
            if ($cbox)
                $cbox.ejCheckBox({ "cssClass": this.model.cssClass, "enableRTL": this.model.enableRTL });
            content.css("display", "none");
            this._createButton("filter", $filter);
            this._createButton("clear", $clear);
            if (type == "number")
                $tBox.ejNumericTextbox({ "cssClass": this.model.cssClass,locale: this.model.locale, "enableRTL": this.model.enableRTL, "value": 0, showSpinButton: false, height: "26px", decimalPlaces: 2, width: "100%" });
            else if (type == "guid" )
                $tBox.css({  "height": "26px", "width": "100%" });
			else if (type == "date") {
                $tBox.attr("id", this._id + "_dpDate")
                $tBox.ejDatePicker({ "cssClass": this.model.cssClass, "enableRTL": this.model.enableRTL, enableStrictMode: true, width: "100%", watermarkText: this.localizedLabels.DatePickerWaterMark, locale: this.model.locale });
                if (!ej.isNullOrUndefined(col.format))
                    $tBox.ejDatePicker({ dateFormat: col.format.replace(/{0:|}/g, function () { return "" }) });
            }
			else if (type == "datetime") {
			    $tBox.attr("id", this._id + "_dpDateTime")
			    $tBox.ejDateTimePicker({ "cssClass": this.model.cssClass, "enableRTL": this.model.enableRTL, enableStrictMode: true, width: "100%", locale: this.model.locale });
			    if (!ej.isNullOrUndefined(col.format))
			        $tBox.ejDateTimePicker({ dateTimeFormat: col.format.replace(/{0:|}/g, function () { return "" }) });
			}
			else if (type == "boolean")
                $tchkBox.ejCheckBox({ "cssClass": this.model.cssClass, "enableRTL": this.model.enableRTL });
            else if (type == "string") {
                $tBox.attr("id", this._id + "_acString");
                $tBox.ejAutocomplete({
                    "cssClass": this.model.cssClass, "enableRTL": this.model.enableRTL, "dataSource": this._dataSource(), width: "100%", height: 26, enableDistinct: true, focusIn: function (args) {
                        var $dropdown = this.element.closest(".e-dialog").find(".e-dropdownlist");
                        var $matchcase = this.element.closest(".e-dialog").find(".e-checkbox").prop("checked");
                        this.model.filterType = $dropdown.ejDropDownList("model.value");
                        this.model.caseSensitiveSearch = $matchcase;
                    },
                    open: function (args) {
                        var doped = !this.element.closest(".e-dialog").ejDialog("isOpened")
                        this.suggestionList.css({ visibility: (doped ? "hidden" : "visible") });
                    }
                    
                });
            }
        },
        _createButton: function (name, element) {
            var $func = name == "filter" ? ej.proxy(this._fltrBtnHandler, this) : ej.proxy(this._fltrClrHandler, this);
            element.ejButton({ "cssClass": this.model.cssClass, "enableRTL": this.model.enableRTL, "click": $func });
        },
        _getIdField: function () {
            var $key;
            $.each(this.model.columns, function (indx, col) {
                if (col.key) {
                    $key = col.field;
                    return false;
                }
            });
            return $key;
        },
        _filterCompleteAction: function () {
            if (this.model.allowPaging)
                this._refreshGridPager();
            if (this.model.filterSettings.filterType == "menu" || this._isExcelFilter) {
                this._closeFDialog();
                var column = this.getColumnByField(this._$curFieldName);
                var index = $.inArray(column, this.model.columns), proxy = this, _addicon = false;
                $.each(this.model.filterSettings.filteredColumns, function (indx, col) {
                    if (col.field == proxy._$curFieldName) {
                        _addicon = true;
                        return false;
                    }
                    else if (col.isComplex == true) {
                        if (col.predicates[0].field == proxy._$curFieldName) {
                            _addicon = true;
                            return false;
                        }
                    }
                });
                var $fIcon = this.getHeaderTable().find("thead").find(".e-headercell").not(".e-detailheadercell,.e-stackedHeaderCell").eq(index).find(".e-filtericon");
                if (_addicon)
                    $fIcon.addClass("e-filteredicon e-filternone");
                else
                    $fIcon.removeClass("e-filteredicon e-filternone");
            }
        },
        _refreshFilterIcon: function () {
            if (!this.model.filterSettings.filteredColumns.length)
                return;
            var filteredCols = ej.distinct(this.model.filterSettings.filteredColumns, "field", true), _$headerCells = this.getHeaderTable().find("thead").find(".e-headercell").not(".e-detailheadercell"), index, col;
            if (this.model.showStackedHeader)
                _$headerCells = _$headerCells.not(".e-stackedHeaderCell");
            if (this.model.allowReordering)
                _$headerCells.find(".e-filtericon").removeClass("e-filteredicon e-filternone");
            for (var i = 0, flen = filteredCols.length; i < flen; i++) {
                col = filteredCols[i]
                index = this.getColumnIndexByField(col.isComplex === true? col.predicates[0].field : col.field);
                _$headerCells.eq(index).find(".e-filtericon").addClass("e-filteredicon e-filternone");
            }
        },
        _setFilterFieldValues: function (id) {
            var $fVal = "", proxy = this;
            var flchk = -1, optr;
            $.each(this.model.filterSettings.filteredColumns, function (indx, value) {
                if (value.field == proxy._$curFieldName)
                    flchk = indx;
            });
            if (flchk == -1 && this._$colType != "boolean") {
                if (this._$colType == "string") {
                    $(".e-predicate input.e-js[type='checkbox']").ejCheckBox({
                        checked: false
                    });
                }
                $(".e-predicate input[name =" + this._id + "_predicate" + this._$colType + "]:first").ejRadioButton({ checked: true });
                $("#" + this._id + this._$colType + "_ddinput").ejDropDownList({
                    selectedItemIndex: 0, change: function (args) {
                        this.element.closest(".e-dialog").find(".e-autocomplete").val($fVal);
                    }
                });
            }
            var filteredFields = $(this.model.filterSettings.filteredColumns).map(function () {
                return this.field;
            }).get();
            if (this._$curFieldName != this._$prevFieldName || $.inArray(this._$curFieldName, filteredFields) != -1) {
                $.each(this.model.filterSettings.filteredColumns, function (indx, col) {
                    if (col.field == proxy._$curFieldName) {
                        var index;
                        var option = proxy._$colType == "number" || proxy._$colType == "date" || proxy._$colType == "datetime" ? "Number" : "String";
                        var $dlist = proxy.localizedLabels[option + "MenuOptions"];                        
                        var optr = ej.isNullOrUndefined(col.actualOperator) ? col.operator : col.actualOperator
                        for (index = 0; index < $dlist.length; index++) {
                            if ($dlist[index].value.toLowerCase() == optr)
                                break;
                        }
                        if (proxy._$colType == "string")
                            $(".e-predicate input.e-js[type='checkbox']").ejCheckBox({ checked: col.matchcase });
                        $("input[value=" + col.predicate + "]").ejRadioButton({ checked: true });
                        $("#" + proxy._id + proxy._$colType + "_ddinput").ejDropDownList({ selectedItemIndex: index });
                        $fVal = col.actualFilterValue != null ? col.actualFilterValue : col.value;
                        return false;
                    }
                });
                if (this._$colType == "boolean") {
                    if ($fVal && $fVal != "")
                        $(id).find(".e-value input:checkbox.e-js").ejCheckBox({checked: true});
                    else
                        $(id).find(".e-value input:checkbox.e-js").ejCheckBox({checked: false});
                } else if (this._$colType == "date" || this._$colType == "datetime") {
                    $(id).find(".e-value .e-datepicker")[this._$colType == "date" ? "ejDatePicker" : "ejDateTimePicker"]("model.value", $fVal);
                } else if(this._$colType == "number"){
					$(id).find(".e-value .e-numerictextbox").ejNumericTextbox("model.value", $fVal);
				} else
                    $(id).find(".e-value input").val($fVal);
            }
        },
        _fltrBtnHandler: function (e) {
            var id = this._id + "_" + this._$colType + "Dlg";
            var $par = $("#" + id);
            var $input = $par.find(".e-value input"), $operator, result, predicateEle;
            var value = $input.val(), matchcase = undefined, filterValue;
            if (this._$colType == "number") {
                $input = $input.filter(".e-numerictextbox");
                value = parseFloat($input.ejNumericTextbox("getValue"));
                matchcase = true;
            }
            if (this._$colType == "string")
                matchcase = $par.find(".e-predicate input[type='checkbox']").is(":checked");
            if (this._$colType == "date" || this._$colType == "datetime") {
                value = ej.parseDate(value, this._$colFormat, this.model.locale);
                matchcase = true;
            }
            if (this._$colType == "boolean") {
                value = $input.ejCheckBox("model.checked") != null ? $input.ejCheckBox("model.checked") : false;
                $operator = "equal";
            } else
                $operator = $("#" + this._id + this._$colType + "_ddinput").ejDropDownList("getSelectedValue").toLowerCase();
            predicateEle = $par.find(".e-predicate input[type='radio']:checked");
            if (this._$colForeignKeyValue && this._$colDropdownData)
                this._fltrForeignKeyValue($operator, value, matchcase, this._$colDropdownData, this._$colForeignKeyField, this._$colForeignKeyValue, this._$colType, predicateEle);
            else
                this.filterColumn(this._$curFieldName, $operator, value, $par.find(".e-predicate input[type='radio']:checked").attr("value"), matchcase);
            if (this.model.isResponsive) {
                $par.css('display', 'none');
                this._setResponsiveFilterIcon();
                this.element.css('display', 'block');
                if (this.model.allowScrolling && (!this.model.enableResponsiveRow || !this.model.minWidth)) {
                    var args = {};
                    args.requestType = 'refresh';
                    this._refreshScroller(args);
                }
            }
        },
        _fltrClrHandler: function (e) {                        
			this.clearFiltering(this._$curFieldName);
        },

        _fltrForeignKeyValue: function (operator, value, matchcase, dataSource, fieldName, mapFieldName, colType, predicateEle) {
            if (ej.isNullOrUndefined(matchcase))
                matchcase = true;
            var operatorCol = [], predicateCol = [], query, filterValue, visible = predicateEle ? predicateEle.css("display") == "none" : true, condition = predicateEle ? predicateEle.attr("value") : "and", predicate;
            var data = dataSource, val;
            if (!(dataSource instanceof ej.DataManager))
                data = new ej.DataManager(dataSource);
            if (colType == "date") {
                var $prevDate = new Date(value.setDate(value.getDate() - 1));
                var $nextDate = new Date(value.setDate(value.getDate() + 2));
                if (operator == "equal" || operator == "notequal") {
                    if (operator == "equal")
                        query = new ej.Query().where(ej.Predicate(mapFieldName, ">", $prevDate, !matchcase)
                            .and(mapFieldName, "<", $nextDate, !matchcase)).select(fieldName);
                    else
                        query = new ej.Query().where(ej.Predicate(mapFieldName, "<=", $prevDate, !matchcase)
                           .or(mapFieldName, ">=", $nextDate, !matchcase)).select(fieldName);
                }
                else
                    query = new ej.Query().where(mapFieldName, operator, value, !matchcase).select(fieldName);
            }
            else
                query = new ej.Query().where(mapFieldName, operator, value, !matchcase).select(fieldName);
            filterValue = { actualFilterValue: value, actualOperator: operator, ejpredicate: undefined, predicate: condition };
            data.executeQuery(query).done(ej.proxy(function (e) {
                val = e.result, requireProc = $.isPlainObject(val[0]), preds = [], merge = false, val = requireProc ? ej.distinct(val, fieldName, false) : val, field = this._$curFieldName;
                predicate = new ej.Predicate(field, "equal", val[0], matchcase);
                for (i = 1, vlen = val.length; i < vlen; i++) {
                    preds.push(new ej.Predicate(field, "equal", val[i], matchcase));
                    merge = true;
                }
                if (merge) {
                    preds.unshift(predicate);
                    predicate = ej.Predicate.or(preds); /*ensure same level for multiple predicates*/
                }
                $.extend(filterValue, { ejpredicate: $.extend(predicate, { field: field }, filterValue) });
                this.filterColumn(field, operator, value, predicateCol, matchcase, filterValue);
            }, this));
        },
        _setDateFilters: function (filterObject, forGrouping) {
            var $prevDate, $nextDate;
            if (!forGrouping && !ej.isNullOrUndefined(this.getColumnByField(filterObject.field).format)) {
                var formatString = this.getColumnByField(filterObject.field).format;
                if (formatString.indexOf("s") != -1) {
                    $prevDate = new Date(filterObject.value.setSeconds(filterObject.value.getSeconds() - 1));
                    $nextDate = new Date(filterObject.value.setSeconds(filterObject.value.getSeconds() + 2));
                }
                else if (formatString.indexOf("m") != -1) {
                    $prevDate = new Date(filterObject.value.setMinutes(filterObject.value.getMinutes() - 1));
                    $nextDate = new Date(filterObject.value.setMinutes(filterObject.value.getMinutes() + 2));
                }
                else if (formatString.indexOf("h") != -1) {
                    $prevDate = new Date(filterObject.value.setHours(filterObject.value.getHours() - 1));
                    $nextDate = new Date(filterObject.value.setHours(filterObject.value.getHours() + 2));
                }
                else {
                    $prevDate = new Date(filterObject.value.setDate(filterObject.value.getDate() - 1));
                    $nextDate = new Date(filterObject.value.setDate(filterObject.value.getDate() + 2));
                }
            }
            else {
                $prevDate = new Date(filterObject.value.setSeconds(filterObject.value.getSeconds() - 1));
                $nextDate = new Date(filterObject.value.setSeconds(filterObject.value.getSeconds() + 2));
            }
            var $prevObj = $.extend({}, filterObject);
            var $nextObj = $.extend({}, filterObject);
            $prevObj.value = $prevDate;
            $nextObj.value = $nextDate;
            if (filterObject.operator == "equal") {
                $prevObj.operator = "greaterthan";
                $prevObj.predicate = "and";
                $nextObj.operator = "lessthan";
                $nextObj.predicate = "and";
            } else {
                $prevObj.operator = "lessthanorequal";
                $prevObj.predicate = "or";
                $nextObj.operator = "greaterthanorequal";
                $nextObj.predicate = "or";
            }
            pred = ej.Predicate($prevObj.field, $prevObj.operator, $prevObj.value, false);
            predicate = pred[$nextObj.predicate](ej.Predicate($nextObj.field, $nextObj.operator, $nextObj.value, false));
            filterObject.value = new Date(filterObject.value.setSeconds($nextObj.value.getSeconds() - 1));
            if (forGrouping)            
                return predicate;            
            else
                this.model.filterSettings.filteredColumns.push($.extend(predicate, { field: filterObject.field, operator: filterObject.operator }));
        }       
    };
})(jQuery, Syncfusion);;
(function ($, ej, undefined) {
    ej.gridFeatures = ej.gridFeatures || {};
    ej.gridFeatures.group = {
        _renderGroupDropArea: function () {
            if(!ej.isNullOrUndefined(this.model.groupSettings.enableDropAreaAnimation))
                this.model.groupSettings.enableDropAreaAutoSizing = this.model.groupSettings.enableDropAreaAnimation;
            var dragLabel = this.model.groupSettings.enableDropAreaAutoSizing ? "" : this.localizedLabels.GroupDropArea;
            if (this.model.groupSettings.showDropArea) {
                var $div = ej.buildTag("div.e-groupdroparea", dragLabel);
                this.model.groupSettings.enableDropAreaAutoSizing && $div.append(ej.buildTag("div.e-animatebutton e-icon").addClass(this.model.groupSettings.enableDropAreaAutoSizing ? "e-animatebuttondown e-gdownarrow" : "e-animatebuttonup e-guparrow"));
                return $div;
            }
        },
        _getColGroup: function (gridObjectId) {
            var gridObject = this.getRsc("helpers", gridObjectId);
            if (gridObject.model.groupSettings.groupedColumns.length == 1)
                var level = this.data.items.level === undefined ? 0 : this.data.items.level - 1;
            else
                var level = this.data.items.level === undefined ? gridObject.model.groupSettings.groupedColumns.length : this.data.items.level - 1;
            var $div = $(document.createElement("div"));
            var $colGroup;
            if (gridObject._isCaptionSummary)
                $colGroup = gridObject._getCaptionColGroup(level);
            else {
                $colGroup = gridObject._getMetaColGroup();
                if (level != gridObject.model.groupSettings.groupedColumns.length && gridObject.model.groupSettings.groupedColumns.length > 1)
                    $colGroup.prepend(gridObject._getIndentCol());
            }
            $div.html($colGroup);
            return $div.html();
        },
        _colSpanAdjust: function (gridObjectId, type, captionDetails) {
            var gridObject, groupData;
            if (ej.isNullOrUndefined(gridObjectId)) {
                gridObject = this;
                groupData = captionDetails;
            }
            else {
                gridObject = this.getRsc("helpers", gridObjectId);
                groupData = this;
            }
            if (gridObject.model.groupSettings.groupedColumns.length == 1) {
                var level = groupData.data.items.level === undefined ? 1 : groupData.data.items.level - 1;
                if (type == "groupcaption")
                    gridObject._currentJsonData = gridObject._currentJsonData.concat(groupData.data.items);
            } else {
                var level = groupData.data.items.level === undefined ? gridObject.model.groupSettings.groupedColumns.length : groupData.data.items.level - 1;
                if (type == "groupcaption" && groupData.data.items.level === undefined)
                    gridObject._currentJsonData = gridObject._currentJsonData.concat(groupData.data.items);
            }            
            gridObject._isGrouping = true;
            var hideGroupColumnCount = !gridObject.model.groupSettings.showGroupedColumn ? gridObject.model.groupSettings.groupedColumns.length : 0;
            var count = 0;
            $.each(gridObject._hiddenColumnsField, function (indx, col) {
                var tempIndex = $.inArray(col, gridObject.model.groupSettings.groupedColumns);
                if (tempIndex != -1) {
                    count = count + 1;
                    if (gridObject.model.groupSettings.showGroupedColumn)
                        hideGroupColumnCount = hideGroupColumnCount + 1;
                }
            })
            var colspan = gridObject.model.columns.length + gridObject.model.groupSettings.groupedColumns.length - level - gridObject._hiddenColumnsField.length - hideGroupColumnCount + count;
            colspan = (gridObject.model.detailsTemplate != null || gridObject.model.childGrid != null) ? colspan + 1 : colspan;

            if (gridObject._isCaptionSummary && type == "groupcaption") {
                var index = [], cIndex = 0;
                var row = gridObject._captionSummary();
                var hiddenIndexCount = 0, summaryColIndexes = [];
                $.each(row[0].summaryColumns, function (cindx, col) {
                    if ($.inArray(col.displayColumn, gridObject._hiddenColumnsField) != -1)
                        cIndex++;
                    summaryColIndexes.push(gridObject.getColumnIndexByField(col.displayColumn));
                    index.push(gridObject.getColumnIndexByField(col.displayColumn) + gridObject.model.groupSettings.groupedColumns.length - level);
                });
                var sumColIndex = ej.min(summaryColIndexes)
                for (var i = 0; i < gridObject._hiddenColumnsField.length; i++) {
                    var colIndex = ej.isNullOrUndefined(gridObject.getColumnByField(gridObject._hiddenColumnsField[i])) ? gridObject.getColumnIndexByHeaderText(gridObject._hiddenColumnsField[i], ej.isNullOrUndefined(gridObject.getColumnByField(gridObject._hiddenColumnsField[i]))) : gridObject.getColumnIndexByField(gridObject._hiddenColumnsField[i]);
                    if (sumColIndex > colIndex)
                        hiddenIndexCount++;
                }
                if (index.length > 0)
                    colspan = ej.min(index);
                colspan = colspan - hiddenIndexCount;
                colspan = (gridObject.model.detailsTemplate != null || gridObject.model.childGrid != null) ? colspan + 1 : colspan;
            }
            return colspan;
        },
        _captionEncode: function (gridObjectId) {
            var gridObject = this.getRsc("helpers", gridObjectId);
            var column = gridObject.getColumnByField(this.data.field);
            return column.disableHtmlEncode;
        },
        _captionFormat: function (gridObjectId) {
            var gridObject = this.getRsc("helpers", gridObjectId);
            var keyValue, captionData = $.extend({}, this.data);
            var column = gridObject.getColumnByField(captionData.field);
            if (column.foreignKeyValue && column.dataSource)
                keyValue = gridObject._foreignKeyBinding(gridObject.getColumnIndexByField(captionData.field), captionData.key, gridObject._id);
            else
                keyValue = captionData.key;
			if(!ej.isNullOrUndefined(column.format) && column.format.indexOf("{0:") == -1){
				captionData[captionData.field] = captionData.key;
				gridObject.data = captionData;
			}
            captionData.key = column.format ? gridObject.formatting(column.format, keyValue, gridObject.model.locale) : keyValue;
            captionData.headerText = column.headerText;
            return $.render[gridObject._id + "_CaptionTemplate"](captionData);
        },
        _getCaptionColGroup: function (level) {
            var cloneColGroup = this.getHeaderTable().find("colgroup").clone();
            var colColl = cloneColGroup.find("col");
            var indentCol = colColl.length - this.model.columns.length;
            if (this.model.detailsTemplate != null || this.model.childGrid != null)
                indentCol = indentCol - 1;
            cloneColGroup.find("col:lt(" + indentCol + ")").remove();
            if (level > 0 && level != this.model.groupSettings.groupedColumns.length) {
                if (this.model.groupSettings.groupedColumns.length > 2 && level != this.model.groupSettings.groupedColumns.length - 1) {
                    for (var i = 0; i < this.model.groupSettings.groupedColumns.length - level; i++) {
                        cloneColGroup.prepend(this._getIndentCol());
                    }
                }
                else
                    cloneColGroup.prepend(this._getIndentCol());
            }
            return cloneColGroup;
        },
        _groupSummaryRow: function (item, aggregates, gridObjectId, showGroup) {
            var gridObject = this.getRsc("helpers", gridObjectId), showGroup = !ej.isNullOrUndefined(showGroup);
            if (gridObject.model.showSummary) {
                if (gridObject.getFooterTable() == null)
                    gridObject._renderGridFooter();
                gridObject._createSummaryRows(gridObject.getFooterTable(), item.records == null ? item : item.records, aggregates, item, showGroup);
                if (gridObject._isCaptionSummary && !showGroup) {
                    var index = [];
                    var row = gridObject._captionSummary();
                    $.each(row[0].summaryColumns, function (cindx, col) {
                        index.push(gridObject.getColumnIndexByField(col.displayColumn));
                    });
                    if (index.length > 0)
                        colIndex = ej.min(index);
                    var colLength = gridObject.model.columns.length;
                    gridObject.getFooterTable().find("tbody td").slice(-(colLength - colIndex)).removeClass("e-summaryrow").addClass("e-groupcaptionsummary");
                }
                if (!gridObject.model.groupSettings.showGroupedColumn) {
                    var groupedcolumns = gridObject.model.groupSettings.groupedColumns;
                    var count = 0;
                    var gridfooterrow = gridObject.getFooterTable().children('tbody').find('tr');
                    for (var j = 0; j < gridObject.model.summaryRows.length; j++) {
                        for (var k = 0; k < gridObject.model.summaryRows[j].summaryColumns.length; k++) {
                            for (var i = 0; i < groupedcolumns.length; i++) {
                                if (groupedcolumns[i] == gridObject.model.summaryRows[j].summaryColumns[k].displayColumn) {
                                    count++;
                                    if (gridObject.model.summaryRows[j].summaryColumns.length == count) {
                                        $(gridfooterrow[j]).addClass("e-hide")
                                    }
                                }
                            }
                        }
                        count = 0;
                    }
                }
                return !showGroup ? gridObject.getFooterTable().find("tbody").find("tr").html() : gridObject.getFooterTable().find("tbody").html();
            }
        },
        addGroupingTemplate: function () {
            var tbody = document.createElement('tbody');
            var expandTd = "<td class='e-recordplusexpand' ej-mappingname='{{:field}}' ej-mappingvalue='{{:key}}'><div class='e-icon e-gdiagonalnext'></div></td>";
            var proxy = this;
            var helpers = {};
            helpers["_" + proxy._id + "ColSpanAdjust"] = this._colSpanAdjust;
            helpers["_" + proxy._id + "Colgroup"] = this._getColGroup;
            if (ej.isNullOrUndefined(this.model.groupSettings.captionFormat))
                $.templates(proxy._id + "_CaptionTemplate", this.localizedLabels.GroupCaptionFormat);
            else
                $.templates(proxy._id + "_CaptionTemplate", this.model.groupSettings.captionFormat);
            helpers["_" + proxy._id + "CaptionFormat"] = this._captionFormat;
            helpers["_" + proxy._id + "GroupSummaryRow"] = this._groupSummaryRow;
            helpers["_" + proxy._id + "CaptionEncode"] = this._captionEncode;
            helpers[proxy._id + "Object"] = this;
            $.views.helpers(helpers);
            var caption = " ~_" + proxy._id + "CaptionFormat('" + proxy._id + "Object')";
            var cpationTd = expandTd + "<td class='e-groupcaption' colspan='{{:~_" + proxy._id + "ColSpanAdjust('" + proxy._id + "Object" + "','groupcaption') }}'>{{if ~_" + proxy._id + "CaptionEncode('" + proxy._id + "Object')}}{{html:" + caption + "}}{{else}}{{:" + caption + "}}{{/if}}</td>";
            if (this._isCaptionSummary && this.model.showSummary)
                cpationTd = cpationTd + "{{:~_" + proxy._id + "GroupSummaryRow(items, aggregates,'" + proxy._id + "Object')}}";
            var captionTr = "<tr>" + cpationTd + "</tr>";
            var $tbody = ej.buildTag("tbody");
            $tbody.html("{{if items.GROUPGUID}}" +
                "{{for items tmpl='" + proxy._id + "_GroupingTemplate'/}}" +
                "{{else}}" +
                "{{for items tmpl='" + proxy._id + "_JSONTemplate'/}}" +
                "{{/if}}");
            var indentTd = "<td class='e-indentcell'></td>";
            var table = "<table class='e-table {{if items.GROUPGUID}}{{else}}e-recordtable{{/if}}' cellspacing='0.25px' >" +
                "{{:~_" + proxy._id + "Colgroup('" + proxy._id + "Object')}}" +
                $tbody.html() + "{{:~_" + proxy._id + "GroupSummaryRow(items, aggregates,'" + proxy._id + "Object', '" + proxy._id + "showGroupCaption')}}" +
            "</table>";
            var tableTd = "<td class='e-tabletd' colspan='{{:~_" + proxy._id + "ColSpanAdjust('" + proxy._id + "Object" + "','table')}}'>" + table + "</td>";
            var tr = "<tr>" + indentTd + tableTd + "</tr>";
            $.templates(proxy._id + "_GroupingTemplate", captionTr + tr);
        },
        addSummaryTemplate: function () {
            var proxy = this;
            $.each(proxy.model.summaryRows, function (cindx, row) {
                $.each(row.summaryColumns, function (cindx, cols) {
                    if (!ej.isNullOrUndefined(cols.template))
                        $.templates(proxy._id + "_summaryTemplate" + cols.template, cols.template)
                });
            });
        },
        _getGroupTopLeftCell: function () {
            var $th = ej.buildTag("th.e-grouptopleftcell");
            $th.append(ej.buildTag("div.e-headercelldiv e-emptyCell", "&nbsp;"));
            return $th;
        },
        _getEmptyFilterBarCell: function () {
            var $th = ej.buildTag("th.e-filterbarcell e-grouptopleftcell");
            return $th;
        },
        _groupingAction: function (refWidth) {
            var $groupTopCell = this.getHeaderTable().find("thead").find(".e-columnheader:not(.e-stackedHeaderRow)").find(".e-grouptopleftcell"), $col = this.getHeaderTable().find("colgroup").find("col");
            var groupColumn = $groupTopCell.length;
            if (groupColumn) {
                this.getHeaderTable().find("colgroup").replaceWith(this._getMetaColGroup());
                (this.model.detailsTemplate != null || this.model.childGrid != null) && this.getHeaderTable().find("colgroup").prepend(this._getIndentCol());
                $groupTopCell.remove();
                this.getHeaderTable().find("thead").find(".e-filterbar").find(".e-filterbarcell:lt(" + groupColumn + ")").remove();
            }
            if (!this.model.allowResizeToFit || refWidth)
                this.setWidthToColumns();
            for (var i = 0; i < this.model.groupSettings.groupedColumns.length; i++) {
                this.getHeaderTable().find("colgroup").prepend(this._getIndentCol());
                this.getHeaderTable().find("thead").find(".e-columnheader").prepend(this._getGroupTopLeftCell());
                this.getHeaderTable().find("thead").find(".e-filterbar").prepend(this._getEmptyFilterBarCell());
            }
            this.getHeaderTable().find(".e-columnheader").find("th.e-grouptopleftcell").last().addClass("e-lastgrouptopleftcell");
        },
        
        groupColumn: function (columnName) {
            if (!this.model.allowGrouping || $.inArray(columnName, this._disabledGroupableColumns) != -1)
                return;
            if (ej.isNullOrUndefined(this.getColumnByField(columnName)) || $.inArray(columnName, this.model.groupSettings.groupedColumns) != -1)
                return;
            this.model.groupSettings.groupedColumns.push(columnName);
            for (var i = 0; i < this.model.sortSettings.sortedColumns.length; i++) {
                if (this.model.sortSettings.sortedColumns[i].field == columnName) {
                    break;
                }
            }
            this.model.sortSettings.sortedColumns.length == i && this.model.sortSettings.sortedColumns.push({ field: columnName, direction: ej.sortOrder.Ascending });
            var args = {};
            args.columnName = columnName;
            args.requestType = ej.Grid.Actions.Grouping;
            var returnValue = this._processBindings(args);
            if (returnValue) {
                if (!($.inArray(columnName, this._scolumns) != -1 || this._gridSort == columnName))
                    this.model.sortSettings.sortedColumns.pop();
                this.model.groupSettings.groupedColumns.pop();
            }
            this._primaryKeyValues = [];
        },
        
        ungroupColumn: function (columnName) {
            if (!this.model.allowGrouping)
                return;
            if ($.inArray(columnName, this.model.groupSettings.groupedColumns) != -1)
                this.model.groupSettings.groupedColumns.splice($.inArray(columnName, this.model.groupSettings.groupedColumns), 1);
            else
                return null;
            var column = this.getColumnByField(columnName)
            if (!this.model.groupSettings.showGroupedColumn && !column["visible"]) {
                var index = this._hiddenColumnsField.indexOf(columnName);
                this._hiddenColumnsField.splice(index, 1);
                column["visible"] = true;
            }
            var args = {};
            for (var i = 0; i < this.model.sortSettings.sortedColumns.length; i++) {
                if (this.model.sortSettings.sortedColumns[i].field == columnName) {
                    if (this._scolumns.indexOf(columnName) != -1 && this.model.allowSorting && this.model.allowMultiSorting || this._gridSort == columnName)
                        if (this.model.allowSorting && this.model.allowMultiSorting) {
                            var no = $.inArray(columnName, this._scolumns);
                            this._scolumns.splice(no, 1);
                            break;
                        }
                        else {
                            this._gridSort = null;
                            break;
                        }
                    else
                        this.model.sortSettings.sortedColumns.splice(i, 1);
                    break;
                }
            }
            args.columnName = columnName;
            args.requestType = ej.Grid.Actions.Ungrouping;
			this._isUngrouping = true;
            var returnValue = this._processBindings(args);
            if (returnValue)
                this.model.groupSettings.groupedColumns.push(columnName);
            this._primaryKeyValues = [];
        },
        
        collapseGroupDropArea: function () {
            var $groupDropArea = this.element.find(".e-groupdroparea").first(), proxy = this;
            this.model.groupSettings.groupedColumns.length == 0 && this.model.groupSettings.enableDropAreaAutoSizing && $groupDropArea.animate({ height: "10px" }, 200, function () {
                if (proxy.model != null && proxy.model.groupSettings.groupedColumns.length == 0) {
                    $(this).html("").append(ej.buildTag("div.e-animatebutton e-animatebuttondown e-icon e-gdownarrow"));
                    $(this).dequeue().css("height", "auto");
                }
            });
        },
        
        expandGroupDropArea: function () {
            var $groupDropArea = this.element.find(".e-groupdroparea").first(), proxy = this;
            this.model.groupSettings.groupedColumns.length == 0 && proxy.model.groupSettings.enableDropAreaAutoSizing && $groupDropArea.animate({ height: "30px" }, 150, function () {
                proxy.model.groupSettings.groupedColumns.length == 0 && $groupDropArea.html(proxy.localizedLabels.GroupDropArea).append(ej.buildTag("div.e-animatebutton e-animatebuttonup e-icon e-guparrow"));
                $groupDropArea.dequeue().css("height", "30px");
            });
        },
        _enableGroupingEvents: function () {
            if (this.model.allowGrouping) {
                this._on(this.element, "click", ".e-groupdroparea,.e-groupheadercell", this._groupHeaderCellClick);
                
                this._on(this.element, "mousedown", ".e-groupheadercell", function (e) {
                    return false;
                });
            }

        },
        _recalculateIndentWidth: function () {
            var proxy = this;
            var browserDetails = this.getBrowserDetails();
            var indentWidth = this.getHeaderTable().find(".e-lastgrouptopleftcell").width(), newWidth = indentWidth, perPixel = indentWidth / 30, $col;
            if (perPixel >= 1)
                newWidth = (30 / perPixel);
            this.getHeaderTable().find("colgroup").find("col").slice(0, this.model.groupSettings.groupedColumns.length).css("width", newWidth + "px");
            var $conCol = this.getContentTable().find("table").filter(":not(.e-recordtable)");
            indentWidth = this.getHeaderTable().find(".e-lastgrouptopleftcell").width();
            if (indentWidth > 30 || (this._isCaptionSummary && (indentWidth >= 30 || (indentWidth > newWidth)))) {
                if (this._isCaptionSummary) {
                    var colgroup = this.model.isEdit ? $conCol.parent(":not(.gridform)").children("colgroup") : $conCol.children("colgroup");
                    $.each(colgroup, function (index, item) {
                        var indentCol = $(item).find("col").length - proxy.model.columns.length;
                        if (proxy.model.detailsTemplate != null || proxy.model.childGrid != null) {
                            if (indentCol > 0)
                                indentCol = indentCol - 1;
                        }
                        $(item).find("col").slice(0, indentCol).css("width", newWidth + "px");
                    });
                }
                else
                    this.model.isEdit ? $conCol.parent(":not(.gridform)").children("colgroup").find("col:first-child").css("width", indentWidth + "px") : $conCol.children("colgroup").find("col:first-child").css("width", indentWidth + "px");
                $col = this.getContentTable().find("colgroup").first().find("col").slice(0, this.model.groupSettings.groupedColumns.length);
                if (browserDetails.browser != "msie")
                    $col.css("width", newWidth + "px");
                else{
                    if (this._isCaptionSummary) 
						$col.css("width", newWidth + "px");
					else
						$col.first().css("width", ((indentWidth / this.element.width()) * 100) + "%");
				}
            } else {
                this.getContentTable().find("colgroup").first().find("col").slice(0, this.model.groupSettings.groupedColumns.length).css("width", newWidth + "px");
                this.getContentTable().find("table").filter(":not(.e-recordtable)").children("colgroup").find("col:first-child").css("width", indentWidth + "px");
            }
            if (this.model.showSummary) {
                var sumCols = this.getContentTable().find("table").filter(".e-groupsummary").find(".e-summary");
                sumCols.css("width", newWidth + "px");
            }
        },
        
        getFieldNameByHeaderText: function (headerText) {
            if (ej.isNullOrUndefined(this._fieldColumnNames[headerText]))
                return null;
            return this._fieldColumnNames[headerText];
        },
        
        getHeaderTextByFieldName: function (field) {
            if (ej.isNullOrUndefined(this._headerColumnNames[field]))
                return null;
            return this._headerColumnNames[field];
        },
        
        expandAll: function () {
            var recordPlus = this.element.find(".e-recordpluscollapse");
            var detailRow = this._excludeDetailRows().find(".e-detailrowcollapse");
            if (recordPlus.length != 0) {
                for (var i = 0; i < recordPlus.length; i++)
                    this.expandCollapse($(recordPlus[i]));
            }
            if (detailRow.length != 0) {
                for (var i = 0; i < detailRow.length; i++)
                    this.expandCollapse($(detailRow[i]));
            }
        },
        
        collapseAll: function () {
            var recordPlus = this.element.find(".e-recordplusexpand");
            var detailRow = this.element.find(".e-detailrowexpand");
            if (recordPlus.length != 0) {
                for (var i = 0; i < recordPlus.length; i++)
                    this.expandCollapse($(recordPlus[i]));
            }
            if (detailRow.length != 0) {
                for (var i = 0; i < detailRow.length; i++)
                    this.expandCollapse($(detailRow[i]));
            }
        },
        _group: function (args) {
            if (this.model.groupSettings.groupedColumns.length && this.model.currentViewData) {
                this._currentJsonData = [];
                var temp = document.createElement('div');
                if (!this.model.groupSettings.showGroupedColumn) {
                    if (!this.initialRender && !ej.isNullOrUndefined(args.columnName) && args.requestType == "grouping") {
                        var col = this.getColumnByField(args.columnName);
                        if ($.inArray(args.columnName, this._hiddenColumnsField) == -1) {
                            this._hiddenColumnsField.push(args.columnName)
                            col.visible = false;
                        }
                    }
                    else {
                        for (i = 0; i < this.model.groupSettings.groupedColumns.length; i++) {
                            if ($.inArray(this.model.groupSettings.groupedColumns[i], this._hiddenColumnsField) == -1) {
                                this._hiddenColumnsField.push(this.model.groupSettings.groupedColumns[i])
                                this.getColumnByField(this.model.groupSettings.groupedColumns[i]).visible = false;
                            }
                        }
                    }
                    this._hideHeaderColumn(this.model.groupSettings.groupedColumns, true);
                    this.getContentTable().children("colgroup").replaceWith(this.getHeaderTable().find('colgroup').clone());
                }
                if (args.requestType == "reorder")
                    this._isReorder = true;
                else
                    this._isReorder = false;
                var $col = this.getContentTable().children("colgroup").find('col');
                var length = $col.length - this.model.columns.length;
                if (this.model.detailsTemplate != null || this.model.childGrid != null)
                    length--;
                if ($col.length > this.model.columns.length)
                    this.getContentTable().children("colgroup").find('col:lt(' + length + ')').remove();
                this.getContentTable().find("colgroup").first().replaceWith(this._getMetaColGroup());
                var dlen;
                if (this.model.detailsTemplate != null || this.model.childGrid != null) {
                    dlen = this.model.groupSettings.groupedColumns.length + 1;
                }
                else
                    dlen = this.model.groupSettings.groupedColumns.length;
                for (var i = 0; i < dlen; i++)
                    this.getContentTable().children("colgroup").prepend(this._getIndentCol());
                if (this.model.currentViewData.length) {
                    var $tbody = this.getContentTable().children('tbody');
                    $tbody.empty();
                    temp.innerHTML = ['<table>', $.render[this._id + "_GroupingTemplate"](this.model.currentViewData, { groupedColumns: this.model.groupSettings.groupedColumns }), '</table>'].join("");
                    this.getContentTable().get(0).replaceChild(temp.firstChild.firstChild, this.getContentTable().get(0).lastChild);
                    this._hideCaptionSummaryColumn();
                }
				else if (this.model.isEdit)
                    this.cancelEdit();
                this._groupingAction();
                this._gridRows = this.getContentTable().find(".e-recordtable").find("tbody").find("tr").not(".e-gridSummaryRows");
                this._eventBindings();
            }
        },
        _ungroup: function () {
            this._isGrouping = false;
            if (!ej.isNullOrUndefined(this.model.detailsTemplate))
                this._detailsOuterWidth = null;
            var $header = this.element.children(".e-gridheader");
            var $filterInput = $header.find(".e-filterbar").find("th").find("input");
            $header.find("div").first().empty().append(this._renderGridHeader().find("table"));
            this.setGridHeaderContent($header);
            if (this.model.allowFiltering && this.model.filterSettings.filterType == "filterbar") {
                this._renderFiltering();
                this._renderFilterBarTemplate();

                var filterThNew = this.element.children(".e-gridheader").find(".e-filterbar").find("th").find("input");
                for (var i = 0; i < $filterInput.length; i++)
                    filterThNew.eq(i).val($filterInput.eq(i).val());
            }
            if (!this.model.groupSettings.showGroupedColumn)
                this._hideHeaderColumn(this.model.groupSettings.groupedColumns, true);
            this.refreshTemplate();
            this.element.find(".e-gridcontent").children("div").first().empty().append(this._renderGridContent().find("table").first());
            this.setGridContent(this.element.find(".e-gridcontent"));
            if (this.model.groupSettings.groupedColumns.length != 0)
                this._gridRows = this.getContentTable().find(".e-recordtable").find("tbody").find("tr").toArray();
            else
                this._gridRows = this.getContentTable().get(0).rows;
           
        },
        _groupHeaderCellClick: function (e) {
            var $target = $(e.target);
            if ($target.hasClass('e-groupdroparea'))
                return;
            if ($target.hasClass("e-ungroupbutton")) {
                var field = $target.parent().attr("ej-mappingname");
                this.ungroupColumn(field);
            } else if ($target.hasClass("e-togglegroupbutton")) {
                var field = $target.parent().attr("ej-mappingname");
                $target.hasClass("e-toggleungroup") && this.ungroupColumn(field);
            } else if ($target.hasClass("e-animatebutton")) {
                if (!$(e.target).hasClass("e-animatebuttondown")) {
                    this.collapseGroupDropArea();
                } else {
                    this.expandGroupDropArea();
                }
            }
            else {
                $target.addClass("e-headercelldiv");
                this._mouseClickHandler(e);
                $target.removeClass("e-headercelldiv");
            }

            return false;
        },
        _captionSummary: function (nocaption) {
            var summary = null, cols = this.model.summaryRows, k, len = cols.length;
            for (k = 0; k < len; k++) {
                if (cols[k].showCaptionSummary == true) {
                    summary = $(cols[k]);
                    break;
                }
            }
            
            if (nocaption) {
                left = cols.slice(0, k), right = cols.slice(k + 1, len);
                ej.merge(summary = left, right);
            }

            return summary;
        },
        _dropAreaHover: function (e) {
            var $target = $(e.target), proxy = this;
            if (e.type == "mouseenter") {
                if (this._dragActive) {
                    if ($target.hasClass("e-groupdroparea"))
                        $target.addClass("e-hover");
                } else
                    $target.removeClass("e-hover");
                $target.hasClass("e-groupheadercell") && this.model.groupSettings.showUngroupButton && $target.find(".e-ungroupbutton").show(150);
            } else if (e.type == "mouseleave") {
                if ($target.hasClass("e-groupdroparea")) {
                    $target.find(".e-ungroupbutton").hide(150);
                    $target.removeClass("e-hover");
                }
                $target.hasClass("e-groupheadercell") && this.model.groupSettings.showUngroupButton && $target.find(".e-ungroupbutton").hide(150);
            }
            return false;
        },
        _groupingCompleteAction: function (args) {
            var $groupDrop = this.element.children(".e-groupdroparea");
            if (this.model.groupSettings.groupedColumns.length && $groupDrop.find(".e-grid-icon").length == 0 || ej.Grid.Actions.Refresh == args.requestType)
                $groupDrop.empty();
            if (this.initialRender || ej.Grid.Actions.Refresh == args.requestType) {
                for (var i = 0; i < this.model.groupSettings.groupedColumns.length; i++)
                    this._addColumnToGroupDrop(this.model.groupSettings.groupedColumns[i]);
                this._refreshGridPager();
            } else
                this._addColumnToGroupDrop(args.columnName);
            this.getHeaderTable().find(".e-columnheader").find(".e-headercelldiv").find(".e-ascending,.e-descending,.e-number").remove();
            for (var i = 0; i < this.model.sortSettings.sortedColumns.length; i++)
                this._addSortElementToColumn(this.model.sortSettings.sortedColumns[i].field, this.model.sortSettings.sortedColumns[i].direction);
            if (!this.initialRender && ej.gridFeatures.dragAndDrop)
                this._groupHeaderCelldrag();
            this.model.allowScrolling && this.getContentTable().parent().scrollLeft(this.getHeaderTable().parent().scrollLeft() - 1);
            this.element.children(".e-cloneproperties").remove();
            if (ej.gridFeatures.filter && ["menu", "excel"].indexOf(this.model.filterSettings.filterType))
                this._refreshFilterIcon();
        },
        _ungroupingCompleteAction: function (args) {
            var $groupDrop = this.element.children(".e-groupdroparea");
            if (args.requestType != ej.Grid.Actions.Refresh)
               this._removeColumnFromDrop(args.columnName);
            this.getHeaderTable().find(".e-columnheader").find(".e-headercelldiv").find(".e-ascending,.e-descending,.e-number").remove();
            for (var i = 0; i < this.model.sortSettings.sortedColumns.length; i++)
                this._addSortElementToColumn(this.model.sortSettings.sortedColumns[i].field, this.model.sortSettings.sortedColumns[i].direction);
            if (this.model.groupSettings.groupedColumns.length == 0) {
                $groupDrop.html(this.model.groupSettings.enableDropAreaAutoSizing ? "" : this.localizedLabels.GroupDropArea);
                this.model.groupSettings.enableDropAreaAutoSizing && $groupDrop.append(ej.buildTag("div.e-animatebutton e-icon").addClass(this.model.groupSettings.enableDropAreaAutoSizing ? "e-animatebuttondown e-gdownarrow" : "e-animatebuttonup e-guparrow"));
                $groupDrop.css("height", "auto");
            }
            if (ej.gridFeatures.dragAndDrop)
                this._headerCellgDragDrop();
            if (this.model.allowReordering && ej.gridFeatures.dragAndDrop)
                this._headerCellreorderDragDrop();
            this.model.allowScrolling && this.getContentTable().parent().scrollLeft(this.getHeaderTable().parent().scrollLeft() + 10);
            this.element.children(".e-cloneproperties").remove();
            if (ej.gridFeatures.filter && ["menu", "excel"].indexOf(this.model.filterSettings.filterType))
                this._refreshFilterIcon();
        },
        _getToggleButton: function () {
            return ej.buildTag("span.e-togglegroupbutton e-icon e-gridgroupbutton", "&nbsp;");
        },
        _checkEinHeader: function (field) {
            var $headerCell = this.element.children(".e-gridheader").find("thead").find(".e-columnheader").find(".e-headercell");
            for (var i = 0; i < $headerCell.length; i++) {
                if ($.trim($headerCell.eq(i).find("div").attr("ej-mappingname")) == field)
                    return $headerCell.eq(i);
                else if (this.model.allowSorting && this.model.allowMultiSorting) {
                    var header = $($headerCell.eq(i)).clone();
                    header.find(".e-number").remove();
                    if ($.trim(header.find("div").attr("ej-mappingname")) == field)
                        return header;
                }
            }
            return null;

        },

        _checkEinGroupDrop: function (field) {
            var $groupHeaderCell = this.element.children(".e-groupdroparea").find(".e-grid-icon");
            for (var i = 0; i < $groupHeaderCell.length; i++) {
                if ($.trim($groupHeaderCell.eq(i).find("div").attr("ej-mappingname")) == field)
                    return $groupHeaderCell.eq(i);
            }
            return null;
        },

        _addColumnToGroupDrop: function (field) {
            var $groupedColumn = ej.buildTag("div.e-grid-icon e-groupheadercell"), $groupDropArea = this.element.find(".e-groupdroparea").first();
            var $childDiv = ej.buildTag("div", {}, {}, { "ej-mappingname": field }), imageDirection = "e-rarrowup-2x";
            var column = this.getColumnByField(field)
            if (column.disableHtmlEncode)
                $groupedColumn.append($childDiv.text(column.headerText));
            else if (column.headerTemplateID)
                $groupedColumn.append($childDiv.html($(column.headerTemplateID).html()))
            else
                $groupedColumn.append($childDiv.html(column.headerText));
            var $headerCell = this._checkEinHeader(field);
            if (this.model.groupSettings.showToggleButton) {
                $childDiv.append(this._getToggleButton().addClass("e-toggleungroup"));
                $headerCell.find(".e-headercelldiv").find(".e-togglegroupbutton").remove().end().append(this._getToggleButton().addClass("e-toggleungroup"));
            }
            var direction = "ascending";
            if ($headerCell.find(".e-ascending,.e-descending").length) {
                direction = $headerCell.find(".e-ascending,.e-descending").hasClass("e-ascending") ? "ascending" : "descending";
                imageDirection = direction == "ascending" ? "e-rarrowup-2x" : "e-rarrowdown-2x";
            }
            $childDiv.append(this._createSortElement().addClass("e-" + direction + " " + imageDirection));
            this.model.groupSettings.showUngroupButton && $childDiv.append(ej.buildTag("span.e-ungroupbutton e-icon e-cancel", " ", {}, { title: this.localizedLabels.UnGroup }));
            $groupDropArea.append($groupedColumn).css("height", "auto");
            var left = $groupedColumn.offset().left, $cloned = $groupedColumn.clone().css("position", "absolute"), proxy = this;
            $groupedColumn.css("visibility", "hidden")
            $groupDropArea.append($cloned).dequeue();
            $cloned.css({ "left": left + 150 }).animate({ left: left }, 150, function (e) {
                $groupedColumn.css("visibility", "visible");
                $cloned.remove();
            });
        },
        _removeColumnFromDrop: function (field) {
            var headerText = this.getHeaderTextByFieldName(field), proxy = this, $groupDropArea = this.element.children(".e-groupdroparea");
            var $groupHeaderCell = $groupDropArea.css("height", "30px").find(".e-grid-icon");
            for (var i = 0; i < $groupHeaderCell.length; i++) {
                if ($.trim($groupHeaderCell.eq(i).find("div").attr("ej-mappingname")) == field) {
                    if (this.model.groupSettings.groupedColumns.length == 0) {
                        this.collapseGroupDropArea();
                    } else
                        $groupHeaderCell.eq(i).remove();
                }
            }
        },
        _setAggreatedCollection: function (clonedQuery) {
            if (this._dataSource() instanceof ej.DataManager && this._dataManager.dataSource.url != undefined && !this._isRemoteSaveAdaptor)
                return;
            var data;
            data = this._dataManager.executeLocal(clonedQuery).result;
            this._aggregatedCollection = data;
        },
        _setAggregates: function (data, collection) {
            var indx, pred, query = new ej.Query();
            data = data || this.model.currentViewData, collection = collection || this._aggregatedCollection;
            var dLen = data.length, cLen;
            if (dLen != 0){
                var fieldPred = ej.Predicate("field", "equal", data[0].field), keyPred = ej.Predicate("key", "equal", data[0].key);
                if(data[0].key instanceof Date) {
                    var dateObject = { value: data[0].key, operator : "equal", field : "key" };
                    keyPred = this._setDateFilters(dateObject,true);
                }
                pred = (fieldPred["and"](keyPred));
            }
            for (indx = 1; indx < dLen; indx++) {
                var fieldPred = ej.Predicate("field", "equal", data[indx].field), keyPred = ej.Predicate("key", "equal", data[indx].key);
                if(data[indx].key instanceof Date) {
                    var dateObject = { value: data[indx].key, operator : "equal", field : "key" };
                    keyPred = this._setDateFilters(dateObject,true);
                }
                pred = pred["or"](fieldPred["and"](keyPred));
            }
            collection = pred ? new ej.DataManager(collection).executeLocal(query.where(pred)) : collection;
            cLen = collection.length;
            if (data.length > 0) {
                for (indx = 0; indx < cLen; indx++) {
                    if (indx > 0 && indx < cLen - 1) continue;
                    data[indx].count = collection[indx].count; 
                    if (data[indx].items.GROUPGUID)
                        this._setAggregates(data[indx].items, collection[indx].items);
                    if (this.model.showSummary) { 
                        var agg = data[indx]["aggregates"] = [];
                        var rows = this.model.summaryRows, scolumns, summaryData;
                        for (var row = 0, rlen = rows.length; row < rlen; row++) {
                            scolumns = rows[row].summaryColumns;
                            for (var col = 0, clen = scolumns.length; col < clen; col++) {
                                summaryData = collection[indx].items.level ? collection[indx].items.records : collection[indx].items;
                                agg[scolumns[col].dataMember + " - " + scolumns[col].summaryType] = this.getSummaryValues(scolumns[col], summaryData);
                            }
                        }
                    }
                }
            }
        },
    };
})(jQuery, Syncfusion);;
(function ($, ej, undefined) {
    ej.gridFeatures = ej.gridFeatures || {};
    ej.gridFeatures.dragAndDrop = {
        _headerCellgDragDrop: function () {
            var proxy = this;
            this.dragHeaderElement();
            var $droppableElements = this.element.children("div.e-groupdroparea");
            $droppableElements.ejDroppable({
                accept: $droppableElements,
                drop: function (event, ui) {
                    if (ej.isNullOrUndefined(ui.helper) || !ui.helper.is(":visible"))
                        return;
                    var column = proxy.getColumnByField($.trim($(ui.draggable.context).find("div").attr("ej-mappingname")));
                    ui.helper.remove();
                    if (proxy._disabledGroupableColumns.length && $.inArray(column["field"], proxy._disabledGroupableColumns) != -1)
                        return;
                    if (!(ej.isNullOrUndefined(column)) && (!(ej.isNullOrUndefined(column.field) || column.field == "")))
                        proxy.groupColumn(column.field);
                }
            });
        },
        _headerCellreorderDragDrop: function () {
            var proxy = this;
            this.dragHeaderElement();
            var $droppableElements = this.element.find(".e-headercell").not(".e-detailheadercell,.e-stackedHeaderCell");
            $droppableElements.ejDroppable({
                accept: $droppableElements,
                drop: function (event, ui) {
                    if (ej.isNullOrUndefined(ui.helper) || !ui.helper.is(":visible") || $(ui.draggable.context).closest('.e-grid').attr("id") != proxy._id)
                        return;
                    if (ui.draggable.attr("aria-sort") == "ascending" || ui.draggable.attr("aria-sort") == "descending") {
                        var scolumn = proxy.getColumnByField($.trim($(ui.draggable.context).find("div").attr("ej-mappingname")));
                        if (proxy.model.allowSorting && proxy.model.allowMultiSorting)
                            proxy._scolumns.push(scolumn.field);
                        else
                            proxy._gridSort = scolumn.field;
                    }
                    var column = proxy.getColumnByField($.trim($(ui.draggable.context).find("div").attr("ej-mappingname")));
                    ui.helper.remove();
                    //if ($.inArray(column["headerText"], proxy._disabledGroupableColumns) != -1)
                    //  return;
                    var header = $(event.dropTarget).clone();
                    header.find(".e-number").remove();
                    if (!ej.isNullOrUndefined(column.field)) {
                        if ($(event.dropTarget).hasClass("e-droppable")) {
                            header = header.children(".e-headercelldiv");
                            var eDropTarget = $(event.dropTarget).children(".e-headercelldiv");
                        }
                        else {
                            header = $(event.dropTarget).parent();
                            var eDropTarget = $(event.dropTarget);
                            if ($(eDropTarget).hasClass("e-filtericon"))
                                eDropTarget = header = $(eDropTarget).siblings(".e-headercelldiv");
                        }
                        if (proxy.model.allowSorting && proxy.model.allowMultiSorting)
                            if (event.dropTarget.hasClass("e-number") || event.dropTarget.hasClass("e-icon")) {
                                var toColumn = proxy.getColumnByField($.trim(header.attr("ej-mappingname")));
                            }
                            else {
                                var toColumn = proxy.getColumnByField($.trim(eDropTarget.attr("ej-mappingname")));
                            }
                        else {
                            if (event.dropTarget.hasClass("e-icon") && !event.dropTarget.hasClass("e-filtericon"))
                                var toColumn = proxy.getColumnByField($.trim(header.attr("ej-mappingname")));
                            else
                                var toColumn = proxy.getColumnByField($.trim(eDropTarget.attr("ej-mappingname")));
                        }
                        proxy.reorderColumns(column.field, toColumn.field);
                    }
                }
            });
        },

        dragHeaderElement: function () {
            var proxy = this;
            var $dragableElements = this.element.children("div.e-gridheader").find("th.e-headercell").not(".e-detailheadercell,.e-stackedHeaderCell");
            var $visualElement = ej.buildTag('div.e-cloneproperties e-grid', "", { 'height': '20px', 'z-index': 2 }), column;
            //header element columnDrag
            $dragableElements.ejDraggable({
                cursorAt: { top: -50, left: -2 },
                helper: function (event, ui) {
                    if (proxy.element.find(".e-dragclone").length > 0) proxy.element.find(".e-dragclone").remove();
                    var $th, hcell;
                    if ($(event.element).hasClass("e-headercell"))
                        $th = $(event.element);
                    else
                        $th = $(event.element).closest("th");
                    hcell = $th.find(".e-headercelldiv");
                    column = proxy.getColumnByField(hcell.attr("ej-mappingname"));
                    proxy._$curSElementTarget = hcell; 
                    if (proxy.model.allowSorting && proxy.model.allowMultiSorting) {
                        var header = $($th).clone();
                        header.find(".e-number").remove();
                        return $visualElement.text(header.text()).clone().width($th.outerWidth() + 2).height($th.height() + 2).css({ "font-size": parseInt(($th.height() + 3) / 2) }).addClass("e-dragclone").appendTo(proxy.element);
                    }
                    else
                        return $visualElement.text($th.text()).clone().width($th.outerWidth() + 2).height($th.height() + 2).css({ "font-size": parseInt(($th.height() + 3) / 2) }).addClass("e-dragclone").appendTo(proxy.element);
                },
                dragStart: function (args) {
                    var target = args.target , $target = $(target);
                    var data = { target: target, draggableType: "headercell", column: column }, isGrouped, toggleClass, dragOnToggle = false;
                    if (proxy.model.groupSettings.showToggleButton && column.allowGrouping){
                        isGrouped = $.inArray(column.field, proxy.model.groupSettings.groupedColumns);
                        toggleClass = $(args.element).find(".e-togglegroupbutton").hasClass("e-togglegroup");
                        if ((isGrouped != -1 && toggleClass) || (isGrouped == -1 && !toggleClass))
                            dragOnToggle = true;
                    }
                    if ((proxy._resizer != null && proxy._resizer._expand) || dragOnToggle || $target.eq(0).hasClass("e-filtericon") || (column.allowGrouping == false && column.allowReordering == false)) {
                        $(".e-dragclone").remove();
                        return false;
                    }
                    proxy._dragActive = true; 
                    if (proxy.model.allowGrouping)
                        proxy.expandGroupDropArea();
                    if (proxy._trigger("columnDragStart", data))
                        return false;
                },
                drag: function (args) {
                    var $target = $(args.target);
                    var data = { target: $target, draggableType: "headercell", column: column };
                    if (proxy._trigger("columnDrag", data))
                        return false;
                    if ($target.closest(".e-grid").attr("id") !== proxy._id)
                        return;
                    proxy.getHeaderTable().find(".e-headercell").removeClass("e-reorderindicate");
                    if (proxy.model.allowReordering && ($target.hasClass('e-headercelldiv') || $target.hasClass('e-headercell')) && !$target.hasClass('e-detailheadercell') && !$target.hasClass('e-stackedHeaderCell') && !$target.parent().hasClass("e-grouptopleftcell")) {
                        document.body.style.cursor = '';
                        $target.addClass("e-allowDrop");
                        proxy.getHeaderTable().find(".e-reorderindicate").removeClass("e-reorderindicate");
                        if ($target.hasClass('e-headercell')) $target.addClass("e-reorderindicate");
                        else $target.parent().addClass("e-reorderindicate");
                    }
                    if ($target.hasClass('e-groupdroparea') || $target.closest('.e-groupdroparea').length) {
                        document.body.style.cursor = '';
                        $target.addClass("e-allowDrop");
                    } else
                        document.body.style.cursor = 'not-allowed';
                },
                dragStop: function (args) {
                    if (!args.element.dropped) {
                        var $target = $(args.target);
                        var data = { target: $target, draggableType: "headercell", column: column };
                        proxy._trigger("columnDrop", data);
                        proxy.element.find(".e-groupdroparea").removeClass("e-hover");
                        proxy.getHeaderTable().find(".e-columnheader").find(".e-headercellactive").removeClass("e-headercellactive").removeClass("e-active");
                        $(".e-dragclone").remove();
                        proxy._dragActive = false;
                        proxy.getHeaderTable().find(".e-reorderindicate").removeClass("e-reorderindicate");
                        if (proxy.model.allowGrouping)
                            proxy.collapseGroupDropArea();
                        document.body.style.cursor = '';
                        $(proxy._Indicator).css('display', 'none');
                    }
                }
            });
        },
        _groupHeaderCelldrag: function () {
            //grouped header cell drag.
            var $visualElement = ej.buildTag('div.e-cloneproperties e-grid', "", { 'height': '20px', 'z-index': 2 });
            var proxy = this;
            var $groupedHeaderCells = this.element.children(".e-groupdroparea").find(".e-groupheadercell");
            $groupedHeaderCells.ejDraggable({
                cursorAt: { top: -35, left: -2 },
                helper: function (event, ui) {
                    var $div = $(event.sender.target).closest(".e-grid-icon");
                    return $visualElement.text($(event.sender.target).closest(".e-groupheadercell").text()).clone().width($div.width() + 2).height($div.height() + 2).addClass("e-dragclone").appendTo(proxy.element);
                },
                dragStart: function (args) {
                    var target = args.target;
                    args.model.cursorAt = { top: -35, left: -2 };
                    var data = { target: target, draggableType: "groupheadercell" };
                    if (proxy._trigger("columnDragStart", data))
                        return false;
                },
                drag: function (args) {
                    $(".Sibling").remove();
                    var $target = $(args.target);
                    var data = { target: $target, draggableType: "groupheadercell" };
                    if (proxy._trigger("columnDrag", data))
                        return false;
                    if ($target.closest('div.e-gridcontent').length) {
                        document.body.style.cursor = '';
                        $target.addClass("e-allowDrop");
                    } else
                        document.body.style.cursor = 'not-allowed';
                },
                dragStop: function (args) {
                    if (!args.element.dropped) {
                        var $target = $(args.target);
                        var data = { target: $target, draggableType: "groupheadercell" };
                        proxy._trigger("columnDrop", data);
                        $(".e-dragclone").remove();
                        document.body.style.cursor = '';
                    }
                }
            });

            //grid content drop
            var $contentDroppableElements = this.element.children(".e-gridcontent, .e-gridheader");
            $contentDroppableElements.ejDroppable({
                accept: proxy.element.children("div.e-groupdroparea").find(".e-groupheadercell"),
                drop: function (event, ui) {
                    if (ej.isNullOrUndefined(ui.helper) || !ui.helper.is(":visible") || !ui.draggable.hasClass("e-groupheadercell"))
                        return;
                    var field = $(ui.draggable.context).find("div").attr("ej-mappingname");
                    ui.helper.remove();
                    if (!ej.isNullOrUndefined(field))
                        proxy.ungroupColumn(field);


                }
            });
        },

        //Rows DragAndDrop
        _rowsDragAndDrop: function () {
            this.dragRowElement();
            var $droppableElements = this.getContentTable();
            var proxy = this;
            $droppableElements.ejDroppable({
                accept: $droppableElements,
                drop: function (event, ui) {
                    var targetRow = $(event.target).closest("tr"), srcControl, currentPageIndex;
                    proxy._draggedGridID = ui.helper.find("tr.e-srcgridinfo").children("td").text();
                    if (proxy._draggedGridID != proxy._id)
                        srcControl = $("#" + proxy._draggedGridID).ejGrid("instance");
                    else
                        srcControl = proxy;
                    if (srcControl._id != proxy._id && srcControl.model.rowDropSettings.dropTargetID != "#" + proxy._id)
                        return false;
                    var records = srcControl.getSelectedRecords();
                    var targetIndex = currentPageIndex = proxy.getIndexByRow(targetRow), count = 0;
                    if (targetIndex == -1)
                        targetIndex = currentPageIndex = 0
                    targetIndex = targetIndex + (proxy.model.pageSettings.currentPage * proxy.model.pageSettings.pageSize) - proxy.model.pageSettings.pageSize;
                    var dropDetails = { sourceID: srcControl._id, destinationID: proxy._id, destinationRowIndex: targetIndex };
                    var dataSource = proxy._dataSource() instanceof ej.DataManager ? proxy._dataSource().dataSource : proxy._dataSource();
                    if (!ej.isNullOrUndefined(proxy.model.rowDropSettings.dropMapper)) {
                        if (ej.isNullOrUndefined(dataSource.headers))
                            dataSource.headers = [];
                        dataSource.headers.push({ rowDropDetails: JSON.stringify(dropDetails) });
                    }
                    if (proxy._id != srcControl._id) {
                        var dm = proxy._dataManager, adaptor = proxy._dataSource().adaptor;
                        var srcBatch = srcControl.getBatchChanges();
                        srcBatch["deleted"] = records;
                        var args = { dropDetails: dropDetails, records: records, requestType: ej.Grid.Actions.Refresh, targetIndex: targetIndex, action: "rowDragged" };
                        proxy._processDropRequest(srcControl, srcBatch, "drag", args);

                        var batch = proxy.getBatchChanges(); batch["added"] = records;
                        args.action = "rowDropped";
                        proxy._processDropRequest(proxy, batch, "drop", args);
                    }
                    else {
                        if (proxy._draggedGridID == proxy._id) {
                            proxy.reorderRows(srcControl.selectedRowsIndexes, currentPageIndex);
                        }
                    }
                }
            });
        },
        dragRowElement: function () {
            var proxy = this;
            var $dragableElements = $(this.getRows());
            var column;
            //header element columnDrag
            $dragableElements.ejDraggable({
                cursorAt: { top: -8, left: -8 },
                helper: function (event, ui) {
                    this.clone = true;
                    if (proxy._selectDrag || $.inArray($(event.sender.target).closest("tr")[0].rowIndex, proxy.selectedRowsIndexes) == -1)
                        return false;
                    var $visualElement = ej.buildTag('div.e-cloneproperties e-draganddrop e-grid', "", { 'height': 'auto', 'z-index': 2, 'position': 'absolute', 'width': proxy.element.width() }), $tr;
                    $visualElement.append(ej.buildTag("table", "", { 'width': proxy.element.width() }));
                    var rows = $(proxy.getRows()).clone().removeClass();
                    var height = 0;
                    $tr = $.map(rows, function (ele, idx) {
                        if ($.inArray(idx, proxy.selectedRowsIndexes) != -1) {
                            return ele
                        }
                    });
                    var infoTr = ej.buildTag('tr.e-srcgridinfo e-grid', "", { 'display': 'none', 'height': 'auto' }).append("<td>" + proxy._id + "</td>");
                    $tr.push(infoTr[0]);
                    $($tr).find("td").removeClass("e-selectionbackground e-active");
                    $visualElement.find("table").append($tr);
                    if (!$(event.sender.target).closest("td").hasClass("e-selectionbackground"))
                        $visualElement.css("display", "none");
                    return $visualElement.addClass("e-dragclone").appendTo(proxy.element);
                },
                dragStart: function (args) {
                    if (proxy._selectDrag || $.inArray($(args.target).closest("tr")[0].rowIndex, proxy.selectedRowsIndexes) == -1)
                        return false;
                    var target = args.target;
                    var rows = proxy.getRowByIndex(proxy.selectedRowsIndexes[0], proxy.selectedRowsIndexes[proxy.selectedRowsIndexes.length]);
                    var records = proxy.getSelectedRecords();
                    var data = { target: rows, currentTarget: target, draggableType: "rows", data: records };
                    if (proxy._trigger("rowDragStart", data))
                        return false;
                },
                drag: function (args) {
                    var $target = $(args.target);
                    var rows = proxy.getRowByIndex(proxy.selectedRowsIndexes[0], proxy.selectedRowsIndexes[proxy.selectedRowsIndexes.length]);
                    var records = proxy.getSelectedRecords();
                    var data = { target: rows, currentTarget: $target, draggableType: "rows", data: records };
                    if (proxy._trigger("rowDrag", data))
                        return false;
                    document.body.style.cursor = 'not-allowed';
                    var dropEle = $(proxy.model.rowDropSettings.dropTargetID);
                    if ($target.closest(proxy.model.rowDropSettings.dropTargetID).length || $target.closest("#" + proxy._id).length) {
                        if ($target.closest(".e-grid").length && ($target.closest(".e-rowcell").length || $target.closest(".emptyrecord").length))
                            $target.closest("table").addClass("e-allowRowDrop")
                        else if (!dropEle.hasClass("e-grid"))
                            dropEle.addClass("e-allowRowDrop");
                    }
                },
                dragStop: function (args) {
                    if (!args.element.dropped) {
                        var $target = $(args.target);
                        var rows = proxy.getRowByIndex(proxy.selectedRowsIndexes[0], proxy.selectedRowsIndexes[proxy.selectedRowsIndexes.length]);
                        var records = proxy.getSelectedRecords();
                        $(".e-dragclone").remove();
                        document.body.style.cursor = '';
                        var dropEle = $(proxy.model.rowDropSettings.dropTargetID);
                        dropEle.hasClass("e-grid") ? dropEle.find(".e-gridcontent").find("table").removeClass("e-allowRowDrop") : dropEle.removeClass("e-allowRowDrop");
                        proxy.getContent().find("table").removeClass("e-allowRowDrop");
                        var data = { rows: rows, target: $target, draggableType: "rows", data: records };
                        if (proxy._trigger("rowDrop", data))
                            return false;
                    }
                }
            });
        },
        _processDropRequest: function (cntrl, batch, action, args) {
            var mapper = cntrl._dataManager.dataSource.batchUrl;
            cntrl._dataManager.dataSource.batchUrl = cntrl.model.rowDropSettings[action + "Mapper"];
            var dragPromise = cntrl._dataManager.saveChanges(batch, cntrl._primaryKeys[0], cntrl.model.query._fromTable);
            if ($.isFunction(dragPromise.promise) && cntrl._dataManager.dataSource.batchUrl != null) {
                $("#" + cntrl._id).data("ejWaitingPopup").show();
                dragPromise.done(function (e) {
                    if (cntrl._isLocalData && (action == "drop")) {
                        if (args.dropDetails.sourceID == args.dropDetails.destinationID)
                            cntrl._moveDroppedRowIndex(args.targetIndex, args.records, args.draggedRowIndexes);
                        else
                            cntrl._moveDroppedRowIndex(args.targetIndex, args.records);
                    }
                    if (action == "drop")
                        cntrl._dataSource() instanceof ej.DataManager ? cntrl._dataSource().dataSource.headers.pop() : cntrl._dataSource().headers.pop();
                    cntrl._dataManager.dataSource.batchUrl = mapper;
                    cntrl.refreshBatchEditChanges();
                    $("#" + cntrl._id).data("ejWaitingPopup").hide();
                    cntrl._processBindings(args);
                });
                dragPromise.fail(function (e) {
                    cntrl._dataManager.dataSource.batchUrl = mapper;
                    $("#" + cntrl._id).data("ejWaitingPopup").hide();
                    args.error = (e && e.error) ? e.error : e;
                    cntrl._trigger("actionFailure", args)
                });
            }
            else {
                cntrl.refreshBatchEditChanges();
                cntrl._dataManager.dataSource.batchUrl = mapper;
                if (action == "drop")
                    cntrl._moveDroppedRowIndex(args.targetIndex, args.records);
                if (!(args.dropDetails.sourceID == args.dropDetails.destinationID && action == "drag"))
                    cntrl._processBindings(args);
            }
        },
        reorderRows: function (indexes, toIndex) {
            if (!this.model.sortSettings.sortedColumns.length) {
                var records = this.getSelectedRecords();
                this.selectedRowsIndexes = [];
                var args = { requestType: ej.Grid.Actions.Refresh, action: "rowReordering", draggedRowIndexes: indexes, targetIndex: toIndex, dropDetails: { sourceID: this._id, destinationID: this._id, DestinationRowIndex: toIndex }, records: records };
                if (ej.isNullOrUndefined(this.model.rowDropSettings.dropMapper)) {
                    if (this._trigger("actionBegin", args))
                        return false;
                    this._moveDroppedRowIndex(toIndex, records, indexes);
                    this._trigger("actionComplete", args)
                } else {
                    var batch = this.getBatchChanges();
                    batch["changed"] = records;
                    this._processDropRequest(this, batch, "drop", args);
                }
            }
        },
        _moveDroppedRowIndex: function (targetIndex, records, reorderFrom) {
            if (!ej.isNullOrUndefined(reorderFrom)) {
                var reorderFrom = reorderFrom.sort();
                var currentargetIndex = targetIndex, skip, index, count = 0;
                var currentRecords = this.model.currentViewData.slice();
                var targetRow = this.getRowByIndex(targetIndex);
                targetIndex += (this.model.pageSettings.currentPage * this.model.pageSettings.pageSize) - this.model.pageSettings.pageSize;
                for (var i = 0; i < reorderFrom.length; i++) {
                    var data = currentRecords[reorderFrom[i]];
                    index = reorderFrom[i] - count;
                    skip = 0;
                    var rows = this._excludeDetailRows();
                    var srcRow = $(rows[index]);
                    if (currentargetIndex > index)
                        count++;
                    if (this.model.allowPaging)
                        skip = (this.model.pageSettings.currentPage * this.model.pageSettings.pageSize) - this.model.pageSettings.pageSize;
                    index = skip + index;
                    this.selectedRowsIndexes.push(currentargetIndex - count);
                    if (i == reorderFrom.length - 1)
                        this.model.selectedRowIndex = this.selectedRowsIndexes[0];
                    if ((this.model.detailsTemplate != null || this.model.childGrid != null) && srcRow.next().hasClass("e-detailrow"))
                        srcRow = srcRow.add(srcRow.next()[0]);
                    targetRow.before(srcRow);
                    if (currentargetIndex < reorderFrom[i] - count)
                        currentargetIndex++
                    else
                        targetIndex--;
                    if (!(this._dataSource() instanceof ej.DataManager))
                        this._dataSource().splice(targetIndex + i, 0, this._dataSource().splice(index, 1)[0])
                    else
                        this._dataSource().dataSource.json.splice(targetIndex + i, 0, this._dataSource().dataSource.json.splice(index, 1)[0])
                    this.model.currentViewData.splice(targetIndex + i - skip, 0, this.model.currentViewData.splice(index - skip, 1)[0])
                }
            }
            else if (targetIndex > -1) {
                var data = this._dataSource() instanceof ej.DataManager ? this._dataSource().dataSource.json : this._dataSource();
                var currentIndex = targetIndex + (this.model.pageSettings.currentPage * this.model.pageSettings.pageSize) - this.model.pageSettings.pageSize;
                for (var i = 0; i < records.length; i++) {
                    data.splice(targetIndex++, 0, data.splice(data.length - records.length + i, 1)[0]);
                }
            }
        },
    };
})(jQuery, Syncfusion);;
(function ($, ej, undefined) {
    ej.gridFeatures = ej.gridFeatures || {};
    ej.gridFeatures.selection = {
        
        selectRows: function (rowIndex, toIndex, target) {
            if (!this._allowrowSelection)
                return false;
            var rowIndexCollection = [];
			if(this.initialRender)
				this.model.currentIndex = rowIndex;
			if(this.model.scrollSettings.enableVirtualization){
				if ($.isArray(rowIndex))
					this.model.currentIndex = rowIndex[0];
				else if(toIndex){
					this.model.currentIndex = rowIndex > toIndex ? toIndex : rowIndex;
				}							
			}
            if (!this.multiSelectCtrlRequest && this.model.scrollSettings.allowVirtualScrolling) {
                if (!this._virtuaOtherPage) {
                    this.clearSelection();
                    this._virtualScrollingSelection = false;
                }
                else
                    this._virtualScrollingSelection = true;
            }
            if ($.isArray(rowIndex)) {
                rowIndexCollection = rowIndex;
				rowIndex = rowIndexCollection[0];
				this._virtaulSel = [];
				if(this.model.scrollSettings.allowVirtualScrolling && !this.model.scrollSettings.enableVirtualization){										
					this._virtualScrollingSelection = true;
					this._virtualSelectedRows = rowIndexCollection;
					var from = (parseInt(rowIndex / this.model.pageSettings.pageSize)) * this.model.pageSettings.pageSize;
					var to = (parseInt((rowIndex / this.model.pageSettings.pageSize)) + 1) * this.model.pageSettings.pageSize;
					this._virtaulSel.push(rowIndex);
					if (!this._virtuaOtherPage)
						this._virtaulUnSel = []
					for (var i = 1; i < rowIndexCollection.length; i++) {
						if (from < rowIndexCollection[i] && rowIndexCollection[i] < to)
							this._virtaulSel.push(rowIndexCollection[i]);
						else
							this._virtaulUnSel.push(rowIndexCollection[i]);
					}										
				}
            }

            var $gridRows = $(this.getRows());
            var args = {}, ascend, res;
            var Data = this._currentJsonData[ej.isNullOrUndefined(rowIndex) ? toIndex : rowIndex];
			var $rowIndex = rowIndex, $prevIndex = this._previousIndex, $prevRow = this.getRowByIndex(this._previousIndex);		
            if (this.model.scrollSettings.allowVirtualScrolling) {
				if(this.model.scrollSettings.enableVirtualization){					
					var virtualRowCount = this._virtualRowCount;
					var currentIndex = Math.ceil((rowIndex + 1) / virtualRowCount);		
					var rowCount = currentIndex > 1 ? this._virtualRowCount: 0;					
					if(this.initialRender || (currentIndex != this._currentVirtualIndex && !target)){
						this._isThumbScroll = true;
						this._refreshVirtualView(currentIndex);						
						rowIndex = rowIndex != 0 ? rowIndex % this._virtualRowCount + rowCount : rowIndex;																			
					}					
					else {						
						if(rowIndex > this._virtualRowCount * 3 || target){
							var viewIndex = this._getSelectedViewData(rowIndex, target).viewIndex;
							var remain = rowIndex % this._virtualRowCount;																												
							$rowIndex = (viewIndex * this._virtualRowCount) - (this._virtualRowCount - remain);	
						}
						else 
							rowIndex = rowIndex % this._virtualRowCount + rowCount;						
						if(rowIndex == $rowIndex && !target)
							rowIndex = rowIndex != 0 ? rowIndex % this._virtualRowCount + rowCount : rowIndex;											
					}
					if(rowIndexCollection.length){												
						for(var i = 0; i < rowIndexCollection.length; i++){
							var viewIndex = this._getSelectedViewData(rowIndexCollection[i]).viewIndex;
							if($.inArray(viewIndex, this._currentLoadedIndexes) != -1)
								this._virtaulSel.push(rowIndexCollection[i]);
							if(!this._virtualSelectedRecords[rowIndexCollection[i]])
								this._virtualSelectedRecords[rowIndexCollection[i]] =  this._getSelectedViewData(rowIndexCollection[i]).data;
						}					
					}
					Data = this._getSelectedViewData(rowIndex, target, currentIndex).data;	
					$prevIndex = this._prevSelIndex;					
					$prevRow = this._prevSelRow;							
				}
				else{
					var pageSize = this.model.pageSettings.pageSize;
					var nameIndx = this.getRowByIndex(rowIndex).attr("name");
					var pageIndex = !ej.isNullOrUndefined(nameIndx) ? (parseInt(nameIndx) / pageSize) + 1 : rowIndex;
					var trIndex = (rowIndex) % (pageSize);
					var pageto = parseInt(rowIndex / pageSize);
					var nameattr = pageto * pageSize;
					if ((!ej.isNullOrUndefined(pageto) && pageto > 0 && $.inArray(nameattr, this.virtualLoadedPages) == -1) && ej.isNullOrUndefined(target)) {
						trIndex--; this._virIndex = true;
						this._virtualTrIndex=trIndex;
						this.gotoPage(pageto + 1);
						var proxy = this;
						if (this._dataSource() instanceof ej.DataManager) {
							this._queryPromise.done(function (e) {
								proxy._virtuaOtherPage=true;
								proxy._virtualdata = proxy._currentJsonData;
								proxy._pageTo = pageto;
								if(proxy._virtualScrollingSelection)
									proxy._virtualSelRecords = e.virtualSelectRecords;
								var from = (parseInt(rowIndex / proxy.model.pageSettings.pageSize)) * proxy.model.pageSettings.pageSize;
								var to = (parseInt((rowIndex / proxy.model.pageSettings.pageSize)) + 1) * proxy.model.pageSettings.pageSize;
								var _selctRow = []
								_selctRow.push(rowIndex);
								for (var i = 1; i < rowIndexCollection.length; i++)
									if (from < rowIndexCollection[i] && rowIndexCollection[i] < to)
										_selctRow.push(rowIndexCollection[i]);
								proxy.selectRows(_selctRow);
								return false;
							});
							if(proxy._virtualScrollingSelection)
								return;
						}
						else {
							proxy._virtualdata = proxy._currentJsonData;
							if (rowIndexCollection.length > 0) {
								proxy._virtualSelRecords = [];
								for (var i = 0; i < rowIndexCollection.length; i++) {
									proxy._virtualSelRecords.push(this.model.dataSource[rowIndexCollection[i]]);
								}
							}
							proxy._pageTo = pageto;
						}
					}
					if (this._virtuaOtherPage) {
						this._virtuaOtherPage=false;
					}
					for (var i = 0; i < this._loadedJsonData.length; i++) {
						if (this._loadedJsonData[i].pageIndex == pageIndex)
							res = this._loadedJsonData[i].data;
					}
					Data = ej.isNullOrUndefined(res) ? this._currentJsonData[trIndex] : res[trIndex];
					Data = this._virtualScrollingSelection ? this._virtualSelRecords : Data;
					var nameattr = this._pageTo * pageSize;
					if (!ej.isNullOrUndefined(this._virtualdata) && this._virtualdata.length > 0) {
						rowIndex = $(document.getElementsByName(nameattr)[trIndex]).index();
						Data = this._virtualdata[trIndex];
						this._virtualdata = [];
					}
					else if ($(document.getElementsByName(pageto * pageSize)).length > 0 && !ej.isNullOrUndefined(this._pageTo))
						rowIndex = $(document.getElementsByName(pageto * pageSize)[rowIndex % pageSize]).index();
				}
            }
            args = { rowIndex: $rowIndex, row: $gridRows.eq(rowIndex), data: Data, target: target,  prevRow: $prevRow, prevRowIndex: $prevIndex };
            if (this._trigger("rowSelecting", args))
                return;
            var $gridRows = $(this.getRows());
            if ((this.model.editSettings.allowEditing || this.model.editSettings.allowAdding) && this.model.isEdit && this.model.enableAutoSaveOnSelectionChange) {
                if (!(this.model.editSettings.showAddNewRow && this.model.editSettings.editMode == "normal") || this.getContentTable().find(".e-editedrow").length != 0) {
                    if (this.endEdit())
                        return;
                    else if (this.model.editSettings.editMode == "externalform" || this.model.editSettings.editMode == "externalformtemplate")
                        $("#" + this._id + "_externalEdit").css("display", "none");
                }
            }
            if (rowIndexCollection.length > 0) {
                for (var i = 0; i < rowIndexCollection.length; i++) {
                    this.selectedRowsIndexes.push(rowIndexCollection[i]);
                }
				if( !this.model.scrollSettings.enableVirtualization){
					var diff = this._virtaulSel[0] - rowIndex;
					for (var i = 0; i < this._virtaulSel.length; i++) {
						this._virtaulSel[i] -= diff;
					}
				}
                rows = this.getRowByIndex(this.model.scrollSettings.allowVirtualScrolling ? this._virtaulSel : rowIndexCollection);
                if (this.model.scrollSettings.frozenColumns)
                    rows = $(rows[0]).add(rows[1]);
                $(rows).attr("aria-selected", "true").find('.e-rowcell, .e-detailrowcollapse, .e-detailrowexpand').addClass("e-selectionbackground e-active");
                Array.prototype.push.apply(this.model.selectedRecords, this.getSelectedRecords());
            }
            else if (ej.isNullOrUndefined(toIndex) || ej.isNullOrUndefined(rowIndex)) {
                rowIndex = ej.isNullOrUndefined(rowIndex) ? toIndex : rowIndex;
                switch (this.model.selectionType) {
                    case ej.Grid.SelectionType.Multiple:
                        if (this.multiSelectCtrlRequest) {
							this.model.selectedRecords = [];
                            var selectedRowIndex = $.inArray($rowIndex, this.selectedRowsIndexes);
                            selectedRowIndex != -1 && this.clearSelection($rowIndex) && this.selectedRowsIndexes.splice(selectedRowIndex, 0);
                            if (selectedRowIndex == -1) {
                                this.selectedRowsIndexes.push($rowIndex);
                                this.getRowByIndex(rowIndex).attr("aria-selected", "true").find('.e-rowcell, .e-detailrowcollapse, .e-detailrowexpand').addClass("e-selectionbackground e-active");
                                if(!this.model.scrollSettings.enableVirtualization)
									this._virtualSelectAction(pageIndex, rowIndex, pageSize);
								else
									this._virtualSelectedRecords[$rowIndex] = this._getSelectedViewData(rowIndex, target).data;
                            }
                            Array.prototype.push.apply(this.model.selectedRecords, this.getSelectedRecords());
                            break;
                        }
                    case ej.Grid.SelectionType.Single:
                        this.clearSelection();
                        this.clearColumnSelection();
                        this.selectedRowsIndexes = [];
                        this.model.selectedRecords = [];
                        this._virtualSelectedRecords = {};
                        this.selectedRowsIndexes.push($rowIndex);
                        this.getRowByIndex(rowIndex).attr("aria-selected", "true").find('.e-rowcell, .e-detailrowcollapse, .e-detailrowexpand').addClass("e-selectionbackground e-active");
                        if(!this.model.scrollSettings.enableVirtualization)
							this._virtualSelectAction(pageIndex, rowIndex, pageSize);
						else
							this._virtualSelectedRecords[$rowIndex] = Data;
                        Array.prototype.push.apply(this.model.selectedRecords, this.getSelectedRecords());
                        break;
                }
            } else {
                if (this.model.selectionType == ej.Grid.SelectionType.Multiple) {
                    this.clearSelection();
                    this.clearColumnSelection();
                    this.selectedRowsIndexes = [];
                    this.model.selectedRecords = [];                  
					this._virtualSelectedRecords = {};
					$toIndex = toIndex;					
					this._virtualUnSel = [];
					this._virtualUnSelIndexes = [];
					if(this.model.scrollSettings.enableVirtualization && target){
						var viewIndex = this._getSelectedViewData(toIndex, target).viewIndex;
						var remain = toIndex % this._virtualRowCount;																												
						$toIndex = (viewIndex * this._virtualRowCount) - (this._virtualRowCount - remain);
						if($rowIndex != this._prevSelIndex)$rowIndex = this._prevSelIndex;																	
					}					
                    ascend = $rowIndex - $toIndex < 0;
					if(!this.model.scrollSettings.enableVirtualization)
						rows = ascend ? this.getRowByIndex(rowIndex, toIndex + 1) : this.getRowByIndex(toIndex, rowIndex + 1);
                    if (this.model.scrollSettings.frozenColumns)
                        rows = $(rows[0]).add(rows[1]);
                    var rowIndexes = [];
                    for (var i = ascend ? $rowIndex : $toIndex, to = ascend ? $toIndex : $rowIndex; i <= to; i++) {
						 if(this.model.scrollSettings.allowVirtualScrolling){
							if(!this.model.scrollSettings.enableVirtualization){
								var nameIndx = this.getRowByIndex(i).attr("name");
								var pageIndex = !ej.isNullOrUndefined(nameIndx) ? (parseInt(nameIndx) / pageSize) + 1 : rowIndex;
								this._virtualSelectAction(pageIndex, i, pageSize);
							}
							else {								
								this._virtualSelectedRecords[i] = this._getSelectedViewData(i).data;
								var viewIndex = this._getSelectedViewData(i).viewIndex;
								if($.inArray(viewIndex, this._currentLoadedIndexes) != -1){
									var indx = this._currentLoadedIndexes.indexOf(viewIndex);
									var selIndex = i % this._virtualRowCount + indx * this._virtualRowCount;
									if(selIndex == 0) indx * this._virtualRowCount;
									rowIndexes.push(selIndex);
								}
								else {
									this._virtualUnSel.push(i);
									if($.inArray(viewIndex, this._virtualUnSelIndexes) == -1)
										this._virtualUnSelIndexes.push(viewIndex);
								}
							}
						}
                        this.selectedRowsIndexes.push(i);
                    }
					if(this.model.scrollSettings.enableVirtualization)
						rows =  this.getRowByIndex(rowIndexes[0], rowIndexes[rowIndexes.length - 1] + 1);
                    $(rows).attr("aria-selected", "true").find('.e-rowcell, .e-detailrowcollapse, .e-detailrowexpand').addClass("e-selectionbackground e-active");
                    Array.prototype.push.apply(this.model.selectedRecords, this.getSelectedRecords());
                }
            }
            if (this._selectedRow() !== $rowIndex)
                this._selectedRow($rowIndex);
            Data = this._virtualScrollingSelection ? this._virtualSelRecords : Data;
			var selectedIndex = this.model.scrollSettings.enableVirtualization ? $rowIndex : this._selectedRow();
            var args = { rowIndex: selectedIndex, row: this.getRowByIndex(this._selectedRow()), data: Data, target: target, prevRow: $prevRow, prevRowIndex : $prevIndex };
            this._previousIndex = this.selectedRowsIndexes.length ? rowIndex :this._previousIndex;
			if(this.model.scrollSettings.enableVirtualization){
				this._prevSelIndex = $rowIndex; 
				this._prevSelRow = this.getRowByIndex(rowIndex);
			}
            if ($(this.getRowByIndex(rowIndex)).is('[role="row"]'))
                this._trigger("rowSelected", args);            
        },

        _virtualSelectAction: function (pageIndex, rowIndex, pageSize) {
            if (this.model.scrollSettings.allowVirtualScrolling && !ej.isNullOrUndefined(rowIndex)) {
                if (!ej.isNullOrUndefined(this._virtualLoadedRecords[pageIndex]))
                    this._virtualSelectedRecords[rowIndex] = this._virtualLoadedRecords[pageIndex][rowIndex % pageSize];
                else
                    this._virtualSelectedRecords[rowIndex] = this._currentJsonData[rowIndex % pageSize];
            }
        },
		_getSelectedViewData: function(rowIndex, target, currentViewIndex){
			var index = rowIndex % this._virtualRowCount, viewIndex, result = {};
			if(target)
				viewIndex = parseInt($(target).closest("tr").attr("name"), 32);
			else if(currentViewIndex)
				viewIndex = currentViewIndex;
			else
				viewIndex = rowIndex > 1 ? Math.ceil((rowIndex + 1) / this._virtualRowCount) : 1;
			result["viewIndex"] = viewIndex;
			if(this._virtualLoadedRecords[viewIndex])
				result["data"] = this._virtualLoadedRecords[viewIndex][index];
			var remain = rowIndex % this._virtualRowCount;	
			result["rowIndex"] = (viewIndex * this._virtualRowCount) - (this._virtualRowCount - remain);
			return result;
		},
        selectCells: function (rowCellIndexes) {
            if (!this._allowcellSelection)
                return false;
            var $cell = null, previousRowCell, prevRowCellIndex;
            var gridRows = this._excludeDetailRows();
            if (this.model.scrollSettings.frozenColumns)
                $cell = this._frozenCell(rowCellIndexes[0][0], rowCellIndexes[0][1][0]);
            else
                $cell = gridRows.eq(rowCellIndexes[0][0]).find(".e-rowcell:eq(" + rowCellIndexes[0][1] + ")");				
            if(!ej.isNullOrUndefined(this._previousRowCellIndex) && this._previousRowCellIndex.length != 0 ){
				if(this.model.scrollSettings.enableVirtualization){
					previousRowCell = this._prevRowCell;
					prevRowCellIndex = this._preVirRowCellIndex;
				}
				else{
					previousRowCell = $(this.getRowByIndex(this._previousRowCellIndex[0][0]).find(".e-rowcell:eq("+this._previousRowCellIndex[0][1]+")"));
					prevRowCellIndex = this._previousRowCellIndex;
				}
			}			
			var $data = this._currentJsonData[rowCellIndexes[0][0]], $rowIndex = rowCellIndexes[0][0], viewDetails;
			if(this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){
				viewDetails = this._getSelectedViewData(rowCellIndexes[0][0], $cell);
				$data = viewDetails.data;
				$rowIndex = viewDetails.rowIndex;
			}				
            var args = { currentCell: $cell, cellIndex: rowCellIndexes[0][1], data: $data, previousRowCellIndex: prevRowCellIndex, previousRowCell: previousRowCell };
            if (this.model.selectionType == "multiple") {
                args["isCtrlPressed"] = this.multiSelectCtrlRequest;
                args["isShiftPressed"] = this.multiSelectShiftRequest;
            }
            if (this._trigger("cellSelecting", args))
                return;
            switch (this.model.selectionType) {
                case ej.Grid.SelectionType.Multiple:
                    if (this.multiSelectCtrlRequest) {
                        var selectedCellIndex = $.inArray($rowIndex, this._rowIndexesColl);
                        if (selectedCellIndex != -1)
                            this.selectedRowCellIndexes[selectedCellIndex].cellIndex.push(parseInt(rowCellIndexes[0][1].toString()));
                        else {
                            if ($.inArray($rowIndex, this._rowIndexesColl) == -1)
                                this._rowIndexesColl.push($rowIndex);
                            this.selectedRowCellIndexes.push({ rowIndex: $rowIndex, cellIndex: rowCellIndexes[0][1] });
                        }
                        $cell.addClass("e-cellselectionbackground e-activecell");
                        break;
                    }
                    else if (this.multiSelectShiftRequest && this._previousRowCellIndex != undefined) {
                        this.clearCellSelection();
                        this.clearColumnSelection();
                        this.selectedRowCellIndexes = [];
                        var previousRowIndex = this._previousRowCellIndex[0][0];
                        var previousCellIndex = parseInt(this._previousRowCellIndex[0][1]);
                        var currentRowIndex = rowCellIndexes[0][0];
                        var currentCellIndex = parseInt(rowCellIndexes[0][1]);
						if(this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){
							previousRowIndex = this._preVirRowCellIndex[0][0];
							currentRowIndex = this._getSelectedViewData(currentRowIndex, this.getRowByIndex(currentRowIndex).find(".e-rowcell")).rowIndex;
						}
                        var newCellColl = [];
                        var min, max;
                        if(this.model.selectionSettings.cellSelectionMode == "box"){
							var $rowCount =  this.model.scrollSettings.frozenColumns ? this.getRows()[0].length - 1 : this.getRows().length - 1;
							var pCellIndex = previousCellIndex < currentCellIndex ? previousCellIndex : currentCellIndex;
							var cCellIndex = pCellIndex == currentCellIndex ? previousCellIndex : currentCellIndex;	
							var newRowColl = [], newCellColl = [];							
							for (var i = pCellIndex; i <= cCellIndex; i++) {								
								min = previousRowIndex;									
								max = currentRowIndex;
								if( min < max ){
									for (var j = min; j <= max; j++) {
										$.inArray(j, newRowColl) == -1 && newRowColl.push(j);											
										this._selectMultipleCells(j, i, currentCellIndex, previousCellIndex);										
									}
								}
								else{
									for (var j = max; j <= min; j++) {
										$.inArray(j, newRowColl) == -1 && newRowColl.push(j);											
										this._selectMultipleCells(j, i, currentCellIndex, previousCellIndex);										
									}
								}
								newCellColl.push(i);								
							}							
							for(var i = 0; i < newRowColl.length; i++){								
								this.selectedRowCellIndexes.push({ rowIndex: newRowColl[i], cellIndex: newCellColl });										
							}
							this._rowIndexesColl = ej.distinct(newRowColl);
						}
                        else if (currentRowIndex > previousRowIndex) {
                            for (var i = previousRowIndex; i <= currentRowIndex; i++) {
                                newCellColl = [];
                                min = i == previousRowIndex ? previousCellIndex : 0;
                                max = i == currentRowIndex ? currentCellIndex : this.model.columns.length - 1;
                                for (var j = min; j <= max; j++) {
                                    newCellColl.push(j);
                                    this._selectMultipleCells(i, j, currentCellIndex, previousCellIndex);
                                }								
                                this.selectedRowCellIndexes.push({ rowIndex: i, cellIndex: newCellColl });
                                this._rowIndexesColl.push(i);
                            }
                        } 						 						
						else {
                            for (var i = previousRowIndex; i >= currentRowIndex; i--) {
                                newCellColl = [];
                                min = i == previousRowIndex ? previousCellIndex : this.model.columns.length - 1;
                                max = i == currentRowIndex ? currentCellIndex : 0;
								if( min > max ){
									for (var j = min; j >= max; j--) {
										newCellColl.push(j);
										this._selectMultipleCells(i, j, currentCellIndex, previousCellIndex);
									}
								}
								else{
									for (var j = max; j >= min; j--) {
										newCellColl.push(j);
										this._selectMultipleCells(i, j, currentCellIndex, previousCellIndex);
									}
								}                                
                                this.selectedRowCellIndexes.push({ rowIndex: i, cellIndex: newCellColl });
                                this._rowIndexesColl.push(i);
                            }
                        }
                        break;
                    }
                    else {
                        this.clearCellSelection();
						this._virtualRowCellSelIndex = [];
                        for (var i = 0; i < rowCellIndexes.length; i++) {
                            if (rowCellIndexes[i][1].length > 1) {
                                var td = gridRows.eq(rowCellIndexes[i][0]).find(".e-rowcell");
                                if (this.model.scrollSettings.frozenColumns)
                                    td = $(gridRows[0]).eq(rowCellIndexes[i][0]).find(".e-rowcell").add($(gridRows[1]).eq(rowCellIndexes[i][0]).find(".e-rowcell"));
                                for (var j = 0; j < td.length; j++) {
                                    var index = (this.model.detailsTemplate != null || this.model.childGrid != null) ? td[j].cellIndex - 1 : j;
                                    if ($.inArray(index, rowCellIndexes[i][1]) != -1) {
                                        $(td[j]).addClass("e-cellselectionbackground e-activecell");
                                        var selectedCellIndex = $.inArray(rowCellIndexes[i][0], this._rowIndexesColl);
                                        if (selectedCellIndex != -1)
                                            this.selectedRowCellIndexes[selectedCellIndex].cellIndex.push(td[j].cellIndex);
                                        else {
											$rowIndex = rowCellIndexes[i][0];
											if(this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){
												viewDetails = this._getSelectedViewData($rowIndex, td);
												$data = viewDetails.data;
												$rowIndex = viewDetails.rowIndex;
											}
                                            this.selectedRowCellIndexes.push({ rowIndex: $rowIndex, cellIndex: [td[j].cellIndex] });
                                            this._rowIndexesColl.push(rowCellIndexes[i][0]);
                                        }
                                    }
                                }
                            }
                            else {
                                if (this.model.scrollSettings.frozenColumns)
                                    this._frozenCell(rowCellIndexes[i][0], rowCellIndexes[i][1][0]).addClass("e-cellselectionbackground e-activecell");
                                else
                                    $(this.getRowByIndex(rowCellIndexes[i][0]).find(".e-rowcell:eq(" + rowCellIndexes[i][1] + ")")).addClass("e-cellselectionbackground e-activecell");
                                this.selectedRowCellIndexes.push({ rowIndex: $rowIndex, cellIndex: rowCellIndexes[i][1] });
                                this._rowIndexesColl.push($rowIndex);
                            }
                        }
                        break;

                    }
                case ej.Grid.SelectionType.Single:
                    this.clearCellSelection();
                    this.clearColumnSelection();
                    this.selectedRowCellIndexes = [];
					this._virtualRowCellSelIndex = [];
                    if ($.inArray($rowIndex, this._rowIndexesColl) == -1)
                       this._rowIndexesColl.push($rowIndex);
                    this.selectedRowCellIndexes.push({ rowIndex: $rowIndex, cellIndex: rowCellIndexes[0][1] });
                    if (this.model.scrollSettings.frozenColumns)
                        this._frozenCell(rowCellIndexes[0][0], rowCellIndexes[0][1][0]).addClass("e-cellselectionbackground e-activecell");
                    else
						$(this.getRowByIndex(rowCellIndexes[0][0]).find(".e-rowcell:eq(" + rowCellIndexes[0][1] + ")")).addClass("e-cellselectionbackground e-activecell");
                    break;
            }
            var args = { currentCell: $cell, cellIndex: rowCellIndexes[0][1], data: $data, selectedRowCellIndex: this.selectedRowCellIndexes, previousRowCellIndex: prevRowCellIndex, previousRowCell: previousRowCell};
            if (!this.multiSelectShiftRequest || ej.isNullOrUndefined(this._previousRowCellIndex)){
				this._previousRowCellIndex = rowCellIndexes;
				if(this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){					
					this._preVirRowCellIndex = $.extend(true, [], rowCellIndexes);
					this._preVirRowCellIndex[0][0] = $rowIndex;
				}											
				this._prevRowCell = $cell;
			} 
            if (this._trigger("cellSelected", args))
                return;			
        },
		_selectMultipleCells: function(i, j, currentCellIndex, previousCellIndex){			
			if (this.model.scrollSettings.frozenColumns)
				this._frozenCell(i, j).addClass("e-cellselectionbackground e-activecell");
			else{				
				if(this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){
					var viewIndex = this._getSelectedViewData(i).viewIndex;
					if($.inArray(viewIndex, this._currentLoadedIndexes) != -1){
						var indx = this._currentLoadedIndexes.indexOf(viewIndex);
						var selIndex = i % this._virtualRowCount + indx * this._virtualRowCount;						
						$(this.getRowByIndex(selIndex).find(".e-rowcell:eq(" + j + ")")).addClass("e-cellselectionbackground e-activecell");
						if($.inArray(i, this._virtualRowCellSelIndex) == -1 && $.inArray(i, this._rowIndexesColl) != -1 && i != this._preVirRowCellIndex[0][0])
							this._virtualRowCellSelIndex.push(i);
					}					
				}
				else
					$(this.getRowByIndex(i).find(".e-rowcell:eq(" + j + ")")).addClass("e-cellselectionbackground e-activecell");
			}
		},

        
        selectColumns: function (columnIndex, toIndex) {
            if (!this._allowcolumnSelection)
                return false;
            this._allowcolumnSelection = true;
            var gridRows = this.getRows();            
            var prevColumnHeaderCell = this.getHeaderTable().find('.e-columnheader').last().find('th.e-headercell').not('.e-detailheadercell')[this._previousColumnIndex];
            var args = { columnIndex: columnIndex == undefined ? toIndex : columnIndex, headerCell: $(this.getHeaderTable().find('.e-columnheader').last().find('th.e-headercell').not('.e-detailheadercell')[columnIndex]), column: this.model.columns[columnIndex], previousColumnIndex: this._previousColumnIndex, prevColumnHeaderCell: prevColumnHeaderCell };
            var $precolIndex = this._previousColumnIndex;
            if ((args["isShiftPressed"] = this.multiSelectShiftRequest) == true)
                this._previousColumnIndex = columnIndex == undefined ? toIndex : columnIndex;
            else
                this._previousColumnIndex = toIndex;
            if (this.model.selectionType == "multiple") {
                args["isCtrlPressed"] = this.multiSelectCtrlRequest;
                args["isShiftPressed"] = this.multiSelectShiftRequest;
            }
            if (this._trigger("columnSelecting", args))
                return;
            if (ej.isNullOrUndefined(toIndex) || ej.isNullOrUndefined(columnIndex)) {
                columnIndex = ej.isNullOrUndefined(columnIndex) ? toIndex : columnIndex;
                switch (this.model.selectionType) {
                    case ej.Grid.SelectionType.Multiple:
                        if (this.multiSelectCtrlRequest) {
                            var selectedColumnIndex = $.inArray(columnIndex, this.selectedColumnIndexes);
                            selectedColumnIndex != -1 && this.clearColumnSelection(columnIndex) && this.selectedColumnIndexes.splice(selectedColumnIndex, 0);
                            if (selectedColumnIndex == -1) {
                                this.selectedColumnIndexes.push(columnIndex);
                                this._previousColumnIndex = this.selectedColumnIndexes.length ? columnIndex : undefined;
                                (this.model.detailsTemplate != null || this.model.childGrid != null) && ++columnIndex;
                                if (this.model.scrollSettings.frozenColumns)
                                    this._frozenColumnSelection(gridRows, columnIndex);
                                else
                                    for (var i = 0; i < gridRows.length; i++) {
                                        $(gridRows[i].cells[columnIndex]).addClass("e-columnselection");
                                    }
                                $(this.getHeaderTable().find("th.e-headercell:not(.e-stackedHeaderCell)")[columnIndex]).addClass("e-columnselection");
                            }
                            break;
                        }
                    case ej.Grid.SelectionType.Single:
                        this.clearSelection();
                        this.clearCellSelection();
                        this.clearColumnSelection();
                        this.selectedColumnIndexes = [];
                        this.selectedColumnIndexes.push(columnIndex);
                        this._previousColumnIndex = this.selectedColumnIndexes.length ? columnIndex : undefined;
                        (this.model.detailsTemplate != null || this.model.childGrid != null) && ++columnIndex;
                        if (this.model.scrollSettings.frozenColumns)
                            this._frozenColumnSelection(gridRows, columnIndex);
                        else
                        for (var i = 0; i < gridRows.length; i++) {
                            $(gridRows[i].cells[columnIndex]).addClass("e-columnselection");
                        }
                        $(this.getHeaderTable().find("th.e-headercell:not(.e-stackedHeaderCell)")[columnIndex]).addClass("e-columnselection");
                        break;
                }
            } else {
                if (this.model.selectionType == ej.Grid.SelectionType.Multiple) {
                    this.clearColumnSelection();
                    this.selectedColumnIndexes = [];
                    var indent = 0;
                    if (this.model.detailsTemplate != null || this.model.childGrid != null) {
                        ++columnIndex; ++toIndex;
                        indent = 1;
                    }
                    var startIndex = columnIndex > toIndex ? toIndex : columnIndex;
                    var endIndex = columnIndex > toIndex ? columnIndex + 1 : toIndex + 1;
                    if (this.model.scrollSettings.frozenColumns)
                        this._frozenColumnSelection(gridRows, startIndex, endIndex);
                    else
                    for (var i = startIndex; i < endIndex; i++) {
                        for (var j = 0; j < gridRows.length; j++) {
                            $(gridRows[j].cells[i]).addClass("e-columnselection");
                        }
                        $(this.getHeaderTable().find("th.e-headercell:not(.e-stackedHeaderCell)")[i]).addClass("e-columnselection");
                        this.selectedColumnIndexes.push(i - indent);
                    }
                }
            }
            var args = { columnIndex: columnIndex == undefined ? toIndex : columnIndex, headerCell: $(this.getHeaderTable().find('.e-columnheader').last().find('th').not('.e-detailheadercell')[columnIndex]), column: this.model.columns[columnIndex], selectedColumnIndex: this.selectedColumnIndexes, previousColumnIndex: $precolIndex, prevColumnHeaderCell: prevColumnHeaderCell };
            if (this._trigger("columnSelected", args))
                return;
        },
        
        clearSelection: function (index) {
             var $gridRows, index;
            if (this._selectedRow() >= -1) {
                if (this.model.scrollSettings.frozenColumns || !ej.isNullOrUndefined(this.model.detailsTemplate || this.model.childGrid))
                    $gridRows = this._excludeDetailRows();
                else
                    $gridRows = $(this.element.find("tr[aria-selected='true']"));
                if (!ej.isNullOrUndefined(index)) {
                    this.getRowByIndex(index).removeAttr("aria-selected").find(".e-selectionbackground").removeClass("e-selectionbackground").removeClass("e-active");
					var row = this.getRowByIndex(index);
					if(this.model.scrollSettings.enableVirtualization && this.multiSelectCtrlRequest && $.inArray(index, this.selectedRowsIndexes) == -1){
						var limit = parseInt(row.attr("name"), 32) * this._virtualRowCount;
						var remain = this._virtualRowCount - row.index() % this._virtualRowCount;	
						index = limit - remain;
					}
                    index = $.inArray(index, this.selectedRowsIndexes);
                    if (index != -1)
                        this.selectedRowsIndexes.splice(index, 1);
                } else {
                    if (this.model.scrollSettings.frozenColumns > 0)
                        $gridRows = $($gridRows[0]).add($gridRows[1]);
                    $gridRows.removeAttr("aria-selected").find(".e-rowcell, .e-detailrowcollapse, .e-detailrowexpand").removeClass("e-selectionbackground").removeClass("e-active");
                    if(!this._clearVirtualSelection){
						this.selectedRowsIndexes = [];
						this.model.selectedRecords = [];
					}
                }
                if (!this.selectedRowsIndexes.length)
                    this._selectedRow(-1);
            }
            return true;
        },

        _excludeDetailRows:function()
		{
			var $gridRows;
			if (!ej.isNullOrUndefined(this.model.detailsTemplate || this.model.childGrid || this.model.showSummary))
                    $gridRows = $(this.getRows()).not(".e-detailrow,.e-gridSummaryRows");
                else
                    $gridRows = $(this.getRows());
			return $gridRows;
		},
        
        clearCellSelection: function (rowIndex, columnIndex) {
            var $gridRows, cellIndex;
            if (this._allowcellSelection) {
                if (this.model.scrollSettings.frozenColumns || !ej.isNullOrUndefined(rowIndex) || !ej.isNullOrUndefined(this.model.detailsTemplate || this.model.childGrid))
                    $gridRows = this._excludeDetailRows();
                else
                    $gridRows = $(this.element.find(".e-cellselectionbackground")).parent();
                if (ej.isNullOrUndefined(rowIndex)) {
                    if (this.model.scrollSettings.frozenColumns)
                        $gridRows = $($gridRows[0]).add($gridRows[1]);
                    $gridRows.find(".e-rowcell, .e-detailrowcollapse, .e-detailrowexpand").removeClass("e-cellselectionbackground").removeClass("e-activecell");
                    this.selectedRowCellIndexes = [];
                    this._rowIndexesColl = [];
                }
                else {
                    for (var i = 0; i < this.selectedRowCellIndexes.length ; i++) {
                        if (this.selectedRowCellIndexes[i].rowIndex == rowIndex) {
                            cellIndex = $.inArray(columnIndex, this.selectedRowCellIndexes[i].cellIndex);
                            if (this.model.scrollSettings.frozenColumns)
                                this._frozenCell(rowIndex, columnIndex).removeClass("e-cellselectionbackground").removeClass("e-activecell");
                            else
                            $gridRows.eq(rowIndex).find(".e-rowcell").eq(columnIndex).removeClass("e-cellselectionbackground").removeClass("e-activecell");
                            break;
                        }
                    }
                    if (i != this.selectedRowCellIndexes.length) {
                        this.selectedRowCellIndexes[i].cellIndex.splice(cellIndex, 1);
                        if (this.selectedRowCellIndexes[i].cellIndex.length == 0) {
                            this.selectedRowCellIndexes.splice(i, 1);
                            this._rowIndexesColl.splice($.inArray(rowIndex, this._rowIndexesColl), 1);
                        }
                    }
                }
            }
            return true;
        },

        
        clearColumnSelection: function (index) {
            if (this._allowcolumnSelection) {
                var $gridRows = $(this._excludeDetailRows());
                if (!ej.isNullOrUndefined(index)) {
                    var indent = 0;
                    if (this.model.detailsTemplate != null || this.model.childGrid != null) {
                        ++index; indent = 1;
                    }
                    if (this.model.scrollSettings.frozenColumns) {
                        var frozenDiv = 0; currentIndex = index;
                        if (index >= this.model.scrollSettings.frozenColumns) {
                            frozenDiv = 1;
                            currentIndex = index - this.model.scrollSettings.frozenColumns;
                        }
                        for (var j = 0; j < $gridRows[frozenDiv].length; j++) {
                            $($gridRows[frozenDiv][j].cells[currentIndex]).removeClass("e-columnselection");
                        }
                    }
                    else
                        for (var i = 0; i < $gridRows.length; i++) {
                            $($gridRows[i].cells[index]).removeClass("e-columnselection");
                        }
                    $(this.getHeaderTable().find("th.e-headercell:not(.e-stackedHeaderCell)")[index]).removeClass("e-columnselection");
                    this.selectedColumnIndexes.splice(0, index - indent);

                } else {
                    if (this.model.scrollSettings.frozenColumns)
                        $gridRows = $($gridRows[0]).add($gridRows[1]);
                    $gridRows.find(".e-rowcell").removeClass("e-columnselection");
                    $(this.getHeaderTable().find("th.e-headercell:not(.e-stackedHeaderCell)")).removeClass("e-columnselection");
                    this.selectedColumnIndexes = [];
                }
            }
            return true;
        },
        getSelectedRows:function(){
            var $rows = $();
            for (var i = 0; i < this.selectedRowsIndexes.length; i++) {
                if (this.model.scrollSettings.frozenColumns > 0) {
                    $rows.push(this.getRowByIndex(this.selectedRowsIndexes[i])[0]);
                    $rows.push(this.getRowByIndex(this.selectedRowsIndexes[i])[1]);
                }
                else
                    $rows.push(this.getRowByIndex(this.selectedRowsIndexes[i])[0]);
            }
            return $rows;
        },
        getSelectedRecords: function () {
            var records = [];
            if (this._virtualScrollingSelection)
                return this._virtualSelRecords;
            for (var i = 0; i < this.selectedRowsIndexes.length; i++) {
                if (this.selectedRowsIndexes[i] != -1) {
                    if (this.model.scrollSettings.allowVirtualScrolling)
                        records.push(this._virtualSelectedRecords[this.selectedRowsIndexes[i]]);
                    else
                        records.push(this._currentJsonData[this.selectedRowsIndexes[i]]);
                }
            }
            return records;
        },
        _setCurrentRow: function (requestType) {
            if (requestType == ej.Grid.Actions.Refresh || requestType == ej.Grid.Actions.Ungrouping || requestType == ej.Grid.Actions.Grouping || requestType == ej.Grid.Actions.Filtering || requestType == ej.Grid.Actions.Sorting || requestType == ej.Grid.Actions.Delete || requestType == ej.Grid.Actions.Save || requestType == ej.Grid.Actions.Cancel || requestType == ej.Grid.Actions.Paging) {
                this._selectedRow(-1);
				if(!this._virtualDataRefresh)
					this.selectedRowsIndexes = [];
            }
        },
        _renderMultiTouchDialog: function () {
            this._customPop = ej.buildTag("div.e-gridpopup", "", { display: "none" });
            var $content = ej.buildTag("div.e-content"), $downTail = ej.buildTag("div.e-downtail e-tail");
            if (this.model.allowMultiSorting) {
                var $selElement = ej.buildTag("span.e-sortdirect e-icon");
                $content.append($selElement);
            }
            if (this.model.selectionType == ej.Grid.SelectionType.Multiple) {
                var $selElement = ej.buildTag("span.e-rowselect e-icon");
                $content.append($selElement);
            }
            this._customPop.append($content);
            this._customPop.append($downTail);
            this.element.append(this._customPop);
        },
    };
})(jQuery, Syncfusion);;
(function ($, ej, undefined) {
    ej.gridFeatures = ej.gridFeatures || {};
    
    ej.widget("ejGrid", "ej.Grid",  {
        
        _rootCSS: "e-grid",
        // widget element will be automatically set in this
        element: null,
        validTags: ["div"],
        // user defined model will be automatically set in this
        model: null,
        _requiresID: true,
        keyConfigs: /** @lends ejGrid# */{
            focus: "e",
            insertRecord: "45", //Insert
            deleteRecord: "46", // delete
            editRecord: "113", //F2
            saveRequest: "13", // enter
            cancelRequest: "27", //Esc
            nextPage: "34", // PgDn
            previousPage: "33", // PgUp
            lastPage: "ctrl+alt+34", //"CtrlAltPgDn",
            firstPage: "ctrl+alt+33", //"CtrlPlusAltPlusPgUp",
            nextPager: "alt+34", //"AltPlusPgDown",
            previousPager: "alt+33", //"AltPlusPgUp",
            firstCellSelection: "36", //"Home",
            lastCellSelection: "35", //"End",
            firstRowSelection: "ctrl+36", //"CtrlPlusHome",
            lastRowSelection: "ctrl+35", //"CtrlPlusEnd",
            upArrow: "38", //Up arrow
            downArrow: "40", //Down arrow
            rightArrow: "39", //Right arrow
            leftArrow: "37", //Left arrow
            moveCellRight: "9", //tab
            moveCellLeft: "shift+9", //shifttab
            selectedGroupExpand: "alt+40", //"AltPlusDownArrow",
            totalGroupExpand: "ctrl+40", //"CtrlPlusDownArrow",
            selectedGroupCollapse: "alt+38", //"AltPlusUpArrow",
            totalGroupCollapse: "ctrl+38", //"CtrlPlusUpArrow",
            multiSelectionByUpArrow: "shift+38",//"shiftPlusUpArrow",
            multiSelectionByDownArrow:"shift+40",//"shiftPlusDownArrow"
        },
        _ignoreOnPersist: [
            "query", "isEdit", "toolbarClick", "queryCellInfo", "mergeCellInfo", "currentViewData", "enableAltRow", "enableRTL", "contextClick", "contextOpen",
            "rowDataBound", "rowTemplate", "detailsDataBound", "detailsTemplate", "childGrid", "summaryRows", "toolbarSettings",
            "editSettings", "allowMultiSorting", "enableAutoSaveOnSelectionChange", "locale", "allowCellMerging",
            "allowTextWrap", "textWrapSettings", "cssClass", "dataSource", "groupSettings.enableDropAreaAutoSizing", "enableRowHover", "showSummary", "allowGrouping",
            "enableHeaderHover", "allowKeyboardNavigation", "scrollSettings.frozenRows", "scrollSettings.frozenColumns", "enableTouch", "contextMenuSettings.enableContextMenu",
            "exportToExcelAction", "exportToWordAction", "exportToPdfAction"
        ],
        ignoreOnExport: [
            "isEdit", "toolbarClick", "query", "queryCellInfo", "selectionType", "currentViewData", "rowDataBound", "rowTemplate",
            "detailsDataBound", "detailsTemplate", "editSettings", "pageSettings", "enableAutoSaveOnSelectionChange", "localization", "allowScrolling",
            "cssClass", "dataSource", "groupSettings.enableDropAreaAnimation", "enableRowHover", "allowSummary",
            "enableHeaderHover", "allowKeyboardNavigation"
        ],
        observables: ["dataSource", "selectedRowIndex", "pageSettings.currentPage"],
        _tags: [{
            tag: "columns",
            attr: ["allowEditing", "allowFiltering", "allowGrouping","allowResizing","allowSorting", "cssClass", "customAttributes", "dataSource", "defaultValue",
			"disableHtmlEncode", "editTemplate", "editType", "foreignKeyField", "foreignKeyValue", "headerTemplateID", "headerText", "isFrozen",
			"isIdentity", "isPrimaryKey","filterBarTemplate", "textAlign", "templateID", "textAlign", "headerTextAlign", "tooltip", "clipMode",
            "validationRules.minlength", "validationRules.maxlength", "validationRules.range", "validationRules.number", "validationRules.required",
            "editParams.decimalPlaces", [{ tag: "commands", attr: ["type", "buttonOptions"] }]
            ],
            content: "template"
        }, {
            tag: "summaryRows",
            attr: ["showCaptionSummary", "showTotalSummary", [{
                tag: "summaryColumns", attr: ["customSummaryValue", "dataMember", "displayColumn", "summaryType", "template"]
            }]]
        }, {
            tag: "stackedHeaderRows",
            attr: [
            [{
                tag: "stackedHeaderColumns", attr: ["headerText", "column"]
            }]]
        }, {
            tag: "filterSettings.filteredColumns", attr: []
        }, {
            tag: "sortSettings.sortedColumns", attr: []
        }],
        _dataSource: ej.util.valueFunction("dataSource"),
        _selectedRow: ej.util.valueFunction("selectedRowIndex"),
        _currentPage: ej.util.valueFunction("pageSettings.currentPage"),
        // default model
        defaults: /** @lends ejGrid# */ {            
            allowPaging: false,            
            showColumnChooser: false,            
            gridLines: "both",            
            allowSorting: false,            
            showStackedHeader: false,            
            selectedRecords: [],
            stackedHeaderRows: [],
            allowFiltering: false,
            allowMultipleExporting: false,            
            allowSelection: true,            
            allowGrouping: false,            
            showSummary: false,            
            allowResizing: false,            
            allowResizeToFit: false,            
            allowTextWrap: false,            
            allowCellMerging: false,            
            enableRowHover: true,            
            enablePersistence: false,
            enableFocusout: false,
            selectedRowIndex: -1,            
            allowSearching: false,
            enableToolbarItems:false,            
            enableHeaderHover: false,            
            allowReordering: false,            
            allowKeyboardNavigation: true,
            allowRowDragAndDrop: false,
            enableTouch: true,
            columnLayout:'auto',            
            selectionType: "single",            
            dataSource: null,            
            cssClass: "",            
            allowScrolling: false,            
            locale: "en-US",            
            enableAutoSaveOnSelectionChange: true,            
            allowMultiSorting: false,
            exportToExcelAction: "ExportToExcel",
            exportToWordAction: "ExportToWord",
            exportToPdfAction: "ExportToPdf",
            _groupingCollapsed: [],
            editSettings:  {                
                allowEditing: false,                
                showAddNewRow: false,                
                allowAdding: false,                
                showAddNewRow: false,                
                allowDeleting: false,                
                editMode: "normal",                
                rowPosition: "top",                
                dialogEditorTemplateID: null,                
                allowEditOnDblClick: true,                
                externalFormTemplateID: null,                
                inlineFormTemplateID: null,                
                formPosition: "bottomleft",               
				titleColumn: null,			   
                showConfirmDialog: true,                
                showDeleteConfirmDialog: false
            },            
            selectionSettings:  {                
                selectionMode: ["row"],                
                enableToggle: false,                
                cellSelectionMode: "flow"
            },
            resizeSettings: {
                resizeMode: 'nextcolumn'
            },
            pageSettings:  {               
                pageSize: 12,                
                pageCount: 8,                
                currentPage: 1,                
                totalPages: null,                
                enableTemplates: false,                
                showDefaults: false,                
                template: null,                
                totalRecordsCount: null,                
                enableQueryString: false,
                printMode: "allpages"
            },            
            groupSettings:  {               
                showDropArea: true,                
                showToggleButton: false,                     
                showGroupedColumn: true,                
                showUngroupButton: true,                
                enableDropAreaAutoSizing: true,                
                captionFormat: null,                
                groupedColumns: []
            },          
            contextMenuSettings: {                
                enableContextMenu: false,                
                contextMenuItems: ["Add Record", "Edit Record", "Delete Record", "Sort In Ascending Order", "Sort In Descending Order", "Next Page", "Last Page", "Previous Page", "First Page", "Save", "Cancel", "Grouping", "Ungrouping"],
                customContextMenuItems: [],
                subContextMenu: [],
                disableDefaultItems: false
            },            
            filterSettings:  {                
                filterType: "filterbar",                
                filterBarMode: "immediate",                
                showFilterBarStatus: true,
                statusBarWidth: 450,                
                showPredicate: false,                
                filteredColumns: [],
                enableInterDeterminateState: true,                
                maxFilterChoices: 1000,                
                enableCaseSensitivity: false,
                immediateModeDelay: 1500,
                enableComplexBlankFilter: true,
                blankValue: ""
            },
            searchSettings:  {                
                fields: [],                
                key: "",                
                operator: "contains",                
                ignoreCase: true
            },            
            sortSettings:  {                                             
                sortedColumns: []
            },            
            toolbarSettings:  {                
                showToolbar: false,                
                toolbarItems: [],                
                customToolbarItems: []
            },            
            minWidth: 0,
            currentIndex: 0,
            rowDropSettings: {
                dropMapper: null,
                dragMapper: null,
                dropTargetID: null,
            },
            scrollSettings: 
            {                
                width: "auto",                
                height: 0,                
                enableTouchScroll: true,                
                allowVirtualScrolling: false,                
                virtualScrollMode: "normal",                
                frozenRows: 0,                
                frozenColumns: 0,
                buttonSize: 18,
                autoHide: false,
                scrollerSize: 18,
                scrollOneStepBy: 57,
				enableVirtualization: false
            },  
            textWrapSettings: {
                wrapMode: "both"
            },                    
            summaryRows: [],            
            enableRTL: false,            
            enableAltRow: true,
            currentViewData: null,            
            detailsTemplate: null,            
            childGrid: null,            
            keySettings: null,            
            rowTemplate: null,            
            detailsDataBound: null,            
            rowDataBound: null,            
            queryCellInfo: null,                      
            mergeCellInfo: null,            
            create: null,            
            actionBegin: null,            
            actionComplete: null,            
            actionFailure: null,            
            beginEdit: null,            
            endEdit: null,            
            endAdd: null,            
            endDelete: null,            
            beforeBatchAdd: null,            
            beforeBatchSave: null,            
            beforeBatchDelete: null,            
            batchAdd: null,            
            batchDelete: null,            
            cellSave: null,            
            cellEdit: null,            
            resizeStart: null,            
            resizeEnd: null,            
            resized: null,            
            load: null,            
            destroy: null,            
            rowSelecting: null,            
            rowSelected: null,            
            cellSelecting: null,            
            cellSelected: null,            
            columnSelecting: null,            
            columnSelected: null,            
            columnDragStart: null,            
            columnDrag: null,            
            columnDrop: null,            
            dataBound: null,            
            recordClick: null,            
            recordDoubleClick: null,            
            templateRefresh: null,            
            rightClick: null,            
            detailsCollapse: null,            
            detailsExpand: null,            
            toolbarClick: null,           
            contextOpen: null,            
            contextClick: null,       
            columns: [],            
            query: null,
            isEdit: false,            
            isResponsive: false,            
            enableResponsiveRow: false,
			virtualLoading: null
        },
        dataTypes: {
            dataSource: "data",
            query: "data",
            columns: "array",
            childGrid: "parent",
            gridLines: "enum",
            summaryRows: "array",
            stackedHeaderRows: "array",
            toolbarSettings: {
                toolbarItems: "array",
                customToolbarItems: "array"
            },
            contextMenuSettings: {
                contextMenuItems: "array",
                customContextMenuItems: "array",
                subContextMenu: "array"
            },
            selectionSettings: {
                selectionMode: "array",
                selectedRecords: "array"
            },
            sortSettings: {
                sortedColumns: "array"
            },
            filterSettings: {
                filteredColumns: "array",
                filterType: "enum",
                filterBarMode: "enum",
            },
            groupSettings: {
                groupedColumns: "array"
            },
            editSettings: {
                editMode: "enum",
                formPosition: "enum",
                rowPosition: "enum",
            },
            searchSettings: {
                fields: "array"
            },
            textWrapSettings: {
                wrapMode: "enum"
            }
        },

        _columns: function (index, property, value, old) {
            var $header = this.element.find(".e-gridheader");
            $header.find("div").first().empty().append(this._renderGridHeader().find("table"));
            this._headerCellgDragDrop();
            this.refreshContent(true);
            this._trigger("refresh");
        },
        _summaryRows: function (index, property, value, old) {
            if (property == "showTotalSummary" || property == "showCaptionSummary") {
                var indx = index.summaryRows;
                var val = value.toLowerCase() == "true" || value.toLowerCase() == "false" ? ej.parseJSON(value) : false;
                this.option("summaryRows")[indx][property] = val;
            }
            this.element.find(".e-gridfooter").remove();
            this._renderGridFooter().insertAfter(this.getContent());
            if (property == "showCaptionSummary" || property == "title") {
                this._isCaptionSummary = this.option("summaryRows")[indx]["showCaptionSummary"];
                this.model.showSummary = this._isCaptionSummary;
                if (this.model.groupSettings.groupedColumns.length != 0)
                    this._refreshCaptionSummary();
            }
        },
        _summaryRows_summaryColumns: function (index, property, value, old) {
            if (property == "displayColumn" || property == "dataMember") {
                if (ej.isNullOrUndefined(this.getColumnByField(value)))
                    return;
            }
            this._createSummaryRows(this.getFooterTable());
            if (this.element.find(".e-groupcaptionsummary").length != 0)
                this._refreshCaptionSummary();
        },
        _stackedHeaderRows_stackedHeaderColumns: function (index, property, value, old) {
            this._refreshStackedHeader();
        },
        _sortSettings_sortedColumns: function (index, property, value, old) {
            var colName, direction;
            var sortObj = this.model.sortSettings.sortedColumns[index["sortSettings.sortedColumns"]];
            if (property == "field") {
                colName = this.getColumnByField(value) != null ? value : null;
                direction = (sortObj.direction == "ascending" || sortObj.direction == "descending") ? sortObj.direction : null;
            }
            else if (property == "direction") {
                colName = this.getColumnByField(sortObj.field) != null ? sortObj.field : null;
                direction = (value == "ascending" || value == "descending") ? value : null;
            }
            if (colName != null && direction != null)
                this.sortColumn(colName, direction);
        },
        _filterSettings_filteredColumns: function (index, property, value, old) {
            var field, operator, matchcase, predicate, filtervalue;
            var filterObj = this.model.filterSettings.filteredColumns[index["filterSettings.filteredColumns"]];
            switch (property) {
                case "field":
                    field = this.getColumnByField(value) != null ? value : null;
                    operator = this._map(ej.FilterOperators, filterObj.operator);
                    filtervalue = filterObj.value;
                    predicate = (filterObj.predicate == "and" || filterObj.predicate == "or") ? filterObj.predicate : null;
                    matchcase = filterObj.matchcase;
                    break;
                case "matchcase":
                    field = this.getColumnByField(filterObj.field) != null ? filterObj.field : null;
                    operator = this._map(ej.FilterOperators, filterObj.operator);
                    filtervalue = filterObj.value;
                    predicate = (filterObj.predicate == "and" || filterObj.predicate == "or") ? filterObj.predicate : null;
                    matchcase = value.toLowerCase() == "true" || value.toLowerCase() == "false" ? ej.parseJSON(value) : false;
                    break;
                case "operator":
                    field = this.getColumnByField(filterObj.field) != null ? filterObj.field : null;
                    operator = this._map(ej.FilterOperators, value);
                    filtervalue = filterObj.value;
                    predicate = (filterObj.predicate == "and" || filterObj.predicate == "or") ? filterObj.predicate : null;
                    matchcase = filterObj.matchcase;
                    break;
                case "predicate":
                    field = this.getColumnByField(filterObj.field) != null ? filterObj.field : null;
                    operator = this._map(ej.FilterOperators, filterObj.operator);
                    filtervalue = filterObj.value;
                    predicate = (value == "and" || value == "or") ? value : null;
                    matchcase = filterObj.matchcase;
                    break;
                case "value":
                    field = this.getColumnByField(filterObj.field) != null ? filterObj.field : null;
                    operator = this._map(ej.FilterOperators, filterObj.operator);
                    filtervalue = value;
                    predicate = (filterObj.predicate == "and" || filterObj.predicate == "or") ? filterObj.predicate : null;
                    matchcase = filterObj.matchcase;
                    break;
            }
            if (field != null && operator != null && filtervalue != null && predicate != null && matchcase != null)
                this.filterColumn(field, operator, filtervalue, predicate, matchcase);
        },
        _map: function (object, value) {
            var data = $.map(object, function (obj) {
                if (obj === value)
                    return obj;
            });
            return data.length != 0 ? data[0] : null;
        },
        _refreshCaptionSummary: function () {
            var temp = document.createElement('div');
            temp.innerHTML = ['<table>', $.render[this._id + "_GroupingTemplate"](this.model.currentViewData, { groupedColumns: this.model.groupSettings.groupedColumns }), '</table>'].join("");
            this.getContentTable().get(0).replaceChild(temp.firstChild.firstChild, this.getContentTable().get(0).lastChild);
            this.refreshContent();
        },
        
        getContentTable: function () {
            return this._gridContentTable;
        },

        setGridContentTable: function (value) {
            this._gridContentTable = value;
        },
        
        getContent: function () {
            return this._gridContent;
        },

        setGridContent: function (value) {
            this._gridContent = value;
        },
        
        getHeaderContent: function () {
            return this._gridHeaderContent;
        },

        setGridHeaderContent: function (value) {
            this._gridHeaderContent = value;
        },
        
        getHeaderTable: function () {
            return this._gridHeaderTable;
        },

        setGridHeaderTable: function (value) {
            this._gridHeaderTable = value;
        },
        
        getRows: function () {
            return this._gridRows;
        },
        
        getFilteredRecords: function () {
            return this._filteredRecords;
        },
        
        getRowByIndex: function (from, to) {
            try {
                var gridRows = this.getRows(), $gridRows = this._excludeDetailRows(), $row = $();
                if ($.isArray(from)) {
                    for (var i = 0; i < from.length; i++) {
                        if (this.model.scrollSettings.frozenColumns > 0) {
                            $row.push(gridRows[0][from[i]]);
                            $row.push(gridRows[1][from[i]]);
                        }
                        else
                            $row.push(gridRows[from[i]]);
                    }
                    return $row;
                }
                else if (ej.isNullOrUndefined(to)) {
                    if (this.model.scrollSettings.frozenColumns > 0) {
                        $row.push(gridRows[0][from]);
                        $row.push(gridRows[1][from]);
                        return $row;
                    }
                    return $(($gridRows).not(".e-virtualrow")[from]);
                } else {
                    if (this.model.scrollSettings.frozenColumns > 0) {
                        $row.push($(gridRows[0]).slice(from, to));
                        $row.push($(gridRows[1]).slice(from, to));
                        return $row;
                    }
                    return $($gridRows.not(".e-virtualrow").slice(from, to));
                }
            } catch (e) {
                return $();
            }
        },
        
        getColumnIndexByField: function (field) {
            for (var i = 0, col = this.model.columns, len = col.length ; i < len ; i++) {
                if (col[i]["field"] === field)
                    return i;
            }
            return -1;
        },
        
        getColumnIndexByHeaderText: function (headerText, field) {
            for (var column = 0; column < this.model.columns.length; column++) {
                if (this.model.columns[column]["headerText"] == headerText) {
                    if (field) {
                        if (ej.isNullOrUndefined(this.model.columns[column]["field"]) || this.model.columns[column]["field"] == "")
                            break;
                    }
                    else
                        break;
                }
            }
            return column;
        },
        
        getIndexByRow: function ($tr) {
            var gridRows = this.getRows(), $gridRows = this._excludeDetailRows(), rowIndex;
            if (this.model.scrollSettings.frozenColumns > 0) {
                rowIndex = $(gridRows[0]).index($tr);
                if (rowIndex == -1)
                    rowIndex = $(gridRows[1]).index($tr);
                return rowIndex;
            } else
                return $gridRows.not(".e-virtualrow").index($tr);
        },
        
        getPrimaryKeyFieldNames: function () {
            if (this._primaryKeys.length != 0)
                return this._primaryKeys;
            for (var key = 0, col = this.model.columns, cLen = col.length; key < cLen; key++) {
                if (col[key]["isPrimaryKey"])
                    this._primaryKeys.push(col[key]["field"]);
            }
            return this._primaryKeys;
        },
        
        getVisibleColumnNames: function (headerText) {
            return this._visibleColumns;
        },
        
        getHiddenColumnNames: function (headerText) {
            return this._hiddenColumns;
        },
        
        getColumnByField: function (field) {
            for (var column = 0; column < this.model.columns.length; column++) {
                if (this.model.columns[column]["field"] == field)
                    break;
            }
            return column == this.model.columns.length ? null : this.model.columns[column];
        },
        
        getsortColumnByField: function (field) {
            for (var column = 0; column < this.model.sortSettings.sortedColumns.length; column++) {
                if (this.model.sortSettings.sortedColumns[column]["field"] == field)
                    break;
            }
            return column == this.model.sortSettings.sortedColumns.length ? null : this.model.sortSettings.sortedColumns[column];
        },
        
        getColumnByHeaderText: function (headerText, field) {
            for (var column = 0; column < this.model.columns.length; column++) {
                if (this.model.columns[column]["headerText"] == headerText) {
                    if (field) {
                        if (ej.isNullOrUndefined(this.model.columns[column]["field"]) || this.model.columns[column]["field"] == "")
                            break;
                    }
                    else
                        break;
                }
            }
            return column == this.model.columns.length ? null : this.model.columns[column];
        },
        
        getCurrentViewData: function () {
            return this._currentJsonData;
        },
        
        getColumnFieldNames: function () {
            var columnNames = [];
            for (var column = 0; column < this.model.columns.length; column++) {
                if (this.model.columns[column]["field"])
                    columnNames.push(this.model.columns[column]["field"]);
            }
            return columnNames;
        },
        
        getBrowserDetails: function () {
            var b = navigator.userAgent.match(/(firefox|chrome|opera|msie|safari)\s?\/?(\d+(.\d+)*)/i);
            if (!!navigator.userAgent.match(/Trident\/7\./))
                return { browser: "msie", version: $.uaMatch(navigator.userAgent).version };
            return { browser: b[1].toLowerCase(), version: b[2] };
        },
        _initPrivateProperties: function () {
            this._click = 0;
			this._tabKey = false;
            this._gridHeaderTable = null;
            this._gridWidth = this.element.width();
            this._id = this.element.attr("id");
            this._gridRows = null;
			this._unboundRow = null;
            this._gridContentTable = null;
            this._gridContent = null;
            this._remoteSummaryData = null;
            this._gridSort = null;
            this._gridHeaderContent = null;
            this._gridFooterContent = null;
            this._gridFooterTable = null;
            this._gridRecordsCount = this._dataSource() !== null ? (this.model.pageSettings.totalRecordsCount == null ? this._dataSource().length : this.model.pageSettings.totalRecordsCount) : 0;
            this._links = null;
            this._gridPager = null;
            this._cSortedColumn = null;
            this._cSortedDirection = null;
            this._$curSElementTarget = null;
            this._gridFilterBar = null;
            this._$curFieldName = null;
            this._$prevFieldName = null;
            this._mediaStatus = false;
            this._$fDlgIsOpen = false;
            this._$menuDlgIsOpen = false;
            this._$colType = null;
            this._$colFormat = null;
            this._$prevColType = null;
            this._$prevSElementTarget = null;
            this._currentFilterColumn = null;
            this._filteredRecordsCount = null;
            this._filteredRecords = [];
            this._validatedColumns = [];
            this.filterColumnCollection = [];
            this._previousFilterCount = null;
            this._excelFilter = null;
            this._isExcelFilter = this.model.filterSettings.filterType == "excel";
            this._$fkColumn = false;
			this._fkParentTblData =[];
            this._primaryKeys = [];
            this._identityKeys = [];
            this._primaryKeyValues = [];
            this._modifiedRecords = [];
            this._addedRecords = [];
            this._tdsOffsetWidth = [];
            this._deletedRecords = [];
            this._disabledToolItems = $();
            this._validationRules = {};
            this._groupedColumns = [];
            this._scolumns = [];
            this._currentJsonData = [];
            this._groupingColumnIndex = 0;
            this._dataManager = this._dataSource() instanceof ej.DataManager ? this._dataSource() : this._dataSource() != null ? ej.DataManager(this._dataSource()) : null;
            if (this._dataManager != null && this.model.allowScrolling && this.model.scrollSettings.allowVirtualScrolling && this.model.pageSettings.totalRecordsCount != null && this._dataManager.dataSource.json != null)
                this._dataManager.dataSource.json.splice(this.model.pageSettings.totalRecordsCount);
            this._isRemoteSaveAdaptor = (this._dataSource() instanceof ej.DataManager && this._dataSource().adaptor instanceof ej.remoteSaveAdaptor);
            this._isLocalData = true;
            this._disabledResizingColumns = [];
            this._disabledSortableColumns = [];
            this._disabledGroupableColumns = [];
            this._disabledFilterableColumns = [];
            this._disabledEditableColumns = [];
            this._hiddenColumns = [];
            this._visibleColumns = [];
            this._visibleColumnsField = [];
            this._hiddenColumnsField = [];
            this._ccVisibleColumns = [];
            this._ccHiddenColumns = [];
            this._sortedColumns = [];
            this.multiSortRequest = false;
            this.multiSelectCtrlRequest = false;
            this.multiSelectShiftRequest = false;
            this._enableSelectMultiTouch = false;
            this._enableSortMultiTouch = false;
            this._templateRefresh = false;
            this.initialRender = false;
            this._selectDrag = false;
            this._isAddNew = false;
            this._fieldColumnNames = {};
            this._headerColumnNames = {};
             this._virtualLoadedRecords = {};
            this._virtualLoadedRows = {};
			this._virtualPageRecords = {};
			this._queryCellView = [];
			this._currentPageViews = [];
            this._virtualLoadedPages = [];                                  
            this._currentLoadedIndexes = [];
			this._prevVirtualSort = [];
			this._prevVirtualFilter = [];
            this._prevVirtualIndex = 0;
            this._currentVirtualIndex = 1;
            this._virtualRowCount = 0;
            this._virtualSelectedRecords = {};
            this.selectedRowsIndexes = [];
            this._isReorder = false;
            this._searchString = "";
            this._searchCount = null;
            this.columnsWidthCollection = [];
            this._Indicator = null;
            this._resizer = null;
            this._bulkEditCellDetails = {
                cellValue: null,
                rowIndex: -1,
                columnIndex: -1,
                fieldName: null,
                _data: null,
                cellEditType: "",
                cancelSave: false,
                defaultData: null,
                insertedTrCollection: [],
                rowData: null
            };
            this.batchChanges = {
                added: [],
                deleted: [],
                changed: []
            };
            this._bulkEditTemplate = $();
            this._confirmDialog = null;
            this._confirmedValue = false;
            this._lastRow = false;
            this._isVirtualRecordsLoaded = false;
            this._scrollValue = 0;
            this._currentTopFrozenRow = this.model.scrollSettings.frozenRows;
            this._rowHeightCollection = [];
            this._scrollObject = null;
            this._customPop = null;
            this.selectedRowCellIndexes = [];
            this._rowIndexesColl = [];
            this.selectedColumnIndexes = [];
			this._allowrowSelection = this._allowcellSelection = this._allowcolumnSelection = false;
            this.commonQuery = $.extend(true, {}, this.model.query);
            if (ej.gridFeatures.group) {
                this._rowCol = this._captionSummary();
                this._isCaptionSummary = (this._rowCol != null && this._rowCol.length) > 0 ? true : false;
            }
            this.phoneMode = this.model.isResponsive && document.documentElement.clientWidth < 360 ? true : false;
            if (this.model.selectionSettings.selectionMode.length > 0 && this.model.allowSelection)
                this._initSelection();
            this._mediaQuery = false;
            this._columnChooserList = null;
            this._$headerCols = null;
            this._$contentCols = null;
            this._detailsOuterWidth = null;
            this._editForm = null;
            this._cloneQuery = null;
            this.localizedLabels = this._getLocalizedLabels();
            this._searchBar = null;
            this._relationalColumns = [];
            this._dropDownManager = {};
			this._isUngrouping = false;
			this._columnChooser = false;
			this._showHideColumns = false;
        },
        _init: function () {
            this._trigger("load");
            if (ej.isNullOrUndefined(this.model.query) || !(this.model.query instanceof ej.Query))
                this.model.query = ej.Query();
            if (!ej.isNullOrUndefined(this.model.parentDetails)) {
                var temp = this.model.queryString, ftemp = this.model.foreignKeyField;
                this.model.query = this.model.query.clone();
                var val = (this.model.parentDetails.parentKeyFieldValue === undefined) ? "undefined" : this.model.parentDetails.parentKeyFieldValue;
                this.model.query.where(ej.isNullOrUndefined(ftemp) ? temp : ftemp, "equal", val, true);
            }
			this._initPrivateProperties();
            if (ej.gridFeatures.common)
                this._initScrolling();            
            if (this.model.enableResponsiveRow)
                this.element.addClass("e-responsive");
            this._checkForeignKeyBinding();
            this._checkDataBinding();
        },
        _initComplexColumn: function (obj, field, cxField) {
            var complexField = cxField || field;
            for (var field1 in obj) {

                if (typeof obj[field1] == "object" && !ej.isNullOrUndefined(obj[field1])) {
                    complexField = complexField.concat(".").concat(field1);
                    this._initComplexColumn(obj[field1], field1, complexField);
                }
                else {
                    var cxFieldName = (complexField).concat(".").concat(field1), value = obj[field1];;
                    this.model.columns.push({
                        field: cxFieldName,
                        type: value != null ? (value.getDay ? (value.getHours() > 0 || value.getMinutes() > 0 || value.getSeconds() > 0 || value.getMilliseconds() > 0 ? "datetime" : "date") : typeof (value)) : null
                    });
                }
            }
        },
        _initColumns: function (object) {
            while (object.items != undefined)
                object = object.items[0];
            if (this.model.columns.length == 0 && object) {
                for (var field in object) {
                    if (object.hasOwnProperty(field) && (typeof (object[field]) != "object" || object[field] instanceof Date || object[field] == null)) {
                        var value = object[field];
                        this.model.columns.push({
                            field: field,
                            type: value != null ? (value.getDay ? (value.getHours() > 0 || value.getMinutes() > 0 || value.getSeconds() > 0 || value.getMilliseconds() > 0 ? "datetime" : "date") : typeof (value)) : null
                        });
                    }
                    else if (typeof (object[field]) == "object") {
                        this._initComplexColumn(object[field], field);
                    }
                }
                this.model.columns.length && this._renderAfterColumnInitialize();
            } else {
                for (var index = 0; index < this.model.columns.length; index++) {
                    this.model.columns[index].field = ej.isNullOrUndefined(this.model.columns[index].field) ? "" : this.model.columns[index].field;
                    if (!ej.isNullOrUndefined(this.model.columns[index].validationRules))
                        this._validatedColumns.push(this.model.columns[index].field);
                    if (ej.isNullOrUndefined(this.model.columns[index].type)) {
                        var $field = !ej.isNullOrUndefined(this.model.columns[index].field) ? ej.getObject(this.model.columns[index].field, object) : null, coldata = this.model.columns[index].dataSource;
                        if (!!coldata && this.model.columns[index].foreignKeyValue) {
                            this.model.columns[index].originalType = $field != null ? ($field.getDay ? ($field.getHours() > 0 || $field.getMinutes() > 0 || $field.getSeconds() > 0 || $field.getMilliseconds() > 0 ? "datetime" : "date") : typeof ($field)) : null;
                            $field = !(coldata instanceof ej.DataManager) ? ej.getObject("0." + this.model.columns[index].foreignKeyValue, coldata) : ej.getObject("0." + this.model.columns[index].foreignKeyValue, this.model.columns[index].foreignKeyData);
                        }
                        this.model.columns[index].type = $field != null ? ($field.getDay ? ($field.getHours() > 0 || $field.getMinutes() > 0 || $field.getSeconds() > 0 || $field.getMilliseconds() > 0 ? "datetime" : "date") : typeof ($field)) : null;
                    }
                    else if (this.model.columns[index]["type"] == "date" && this.model.columns[index].format == undefined && this._isReorder != true && this.model.allowGrouping !=true && !this._showHideColumns)
                        if (ej.isNullOrUndefined(ej.globalize))
                            $.extend(this.model.columns[index], { format: "{0:" + ej.preferredCulture().calendars.standard.patterns.d + "}" });
                        else
                            $.extend(this.model.columns[index], { format: "{0:M/d/yyyy}" });
                    else if (this.model.columns[index]["type"] == "datetime" && this.model.columns[index].format == undefined && this._isReorder != true && this.model.allowGrouping !=true && !this._showHideColumns)
                        if (ej.isNullOrUndefined(ej.globalize))
                            $.extend(this.model.columns[index], { format: "{0:" + ej.preferredCulture().calendars.standard.patterns.d + " " + ej.preferredCulture().calendars.standard.patterns.t + "}" });
                        else
                            $.extend(this.model.columns[index], { format: "{0:M/d/yyyy h:mm tt}" });                    
                  }
            }
        },
        _initSelection: function () {
            var mode = this.model.selectionSettings.selectionMode;
            for (i = 0; i < mode.length; i++) {
                this["_allow" + mode[i] + "Selection"] = true;
            }
        },
        _checkDataBinding: function () {
            if (!this.model.columns.length && (((this._dataSource() == null || !this._dataSource().length) && !(this._dataSource() instanceof ej.DataManager)) || ((this._dataSource() instanceof ej.DataManager) && this._dataManager.dataSource.url == undefined && !this._dataSource().dataSource.json.length))) {
                this._renderAlertDialog();
                this._alertDialog.find(".e-content").text(this.localizedLabels.EmptyDataSource);
                this._alertDialog.ejDialog("open");
                return;
            }
            this._initialRenderings();
            if (this.model.editSettings.allowDeleting && this.model.selectionType == "multiple")
                this.multiDeleteMode = true;
            this.initialRender = true;
            this.model.enableRTL && this.element.addClass("e-rtl");
            if (this.model.allowFiltering && this._isExcelFilter)
                this._renderExcelFilter();
            if (this.model.cssClass != null)
                this.element.addClass(this.model.cssClass);
            if (this.model.allowGrouping)
                this.element.append(this._renderGroupDropArea());
            if (this.model.toolbarSettings.showToolbar || ((this.model.allowSorting || this.model.allowFiltering) && this.model.enableResponsiveRow))
                this.element.append(this._renderToolBar());
            var columns = this.model.columns;
            if (columns && columns.length) {
                var expands = this.model.query._expands;                
                if (typeof columns[0] === "string")
                    for (var i = 0; i < columns.length; i++)
                        columns[i] = { field: columns[i] };
                for (var i = 0; i < columns.length; i++) {
                    if (!columns[i].field || columns[i].field.indexOf('.') === -1) continue;
                    this._getExpands(columns[i].field, expands);
                }
                this.model.query.expand(expands);
                this.commonQuery.expand(expands);
                this._renderAfterColumnInitialize();
            }
            if (this.model.allowPaging)
                this.element.append(this._renderGridPager());
            if (this.model.contextMenuSettings.enableContextMenu)
                this.element.append(this._renderContext());
            if ($.isFunction($.fn.ejWaitingPopup)) {
                this.element.ejWaitingPopup({ showOnInit: false });
                $("#" + this._id + "_WaitingPopup").addClass("e-gridwaitingpopup");
            }
            if (this.model.scrollSettings.allowVirtualScrolling) {
                this._loadedJsonData = [];
                this._prevPage = 1;
            }
            if (this._dataSource() instanceof ej.DataManager) {
                this.element.ejWaitingPopup("show");
                if (this._dataSource().ready != undefined) {
                    var proxy = this;
                    this._dataSource().ready.done(function (args) {
                        proxy._initDataSource();
                        proxy.model.dataSource = ej.DataManager(args.result);
                    });
                } else {
                    this.element.ejWaitingPopup("show");
                    this._initDataSource();
                }
            } else {
                this._ensureDataSource();
                this._trigger("actionBegin");
                this._setForeignKeyData();
                this._relationalColumns.length == 0 && this._initGridRender();
				this._vRowHeight = Math.floor(this.getRowHeight());
            }
            if (this.model.showColumnChooser)
                this._renderColumnChooser();
        },
        _renderColumnChooser: function () {
            var $columnButton = ej.buildTag("button .e-ccButton", this.localizedLabels.Columns, { 'float': (this.model.enableRTL ? 'left' : 'right') }).attr("type", "button");
            this.element.prepend($columnButton);
            $columnButton.ejButton({
                prefixIcon: "e-down-arrow",
                imagePosition: "imageright",
                contentType: "textandimage",
                type: 'button',
                click: $.proxy(this._ccClickHandler, this),
                width: 90
            });
            var buttHeight = $columnButton.outerHeight();
            $columnButton.css('margin-top', 0 - (buttHeight));
            var elementTop = parseInt(this.element.css('margin-top'),10);
            this.element.css('margin-top', elementTop + buttHeight);
            var $mainDiv = ej.buildTag("div");
            var $outerDiv = ej.buildTag("div .e-grid e-columnChooser", '', {}, { id: this._id + "ccDiv" });
            if ($("#" + this._id + "ccDiv").data("ejDialog") != undefined) {
                $("#" + this._id + "ccDiv").ejDialog("destroy");
                $("#" + this._id + "ccDiv").remove();
            }
            var $searchBox = ej.buildTag("div.e-searchbox e-fields").append(ej.buildTag("input#" + this._id + "_ccSearchBox.e-ejinputtext e-filtertext", {}, {}, { "type": "text" }))
            var $sapnDiv = ej.buildTag('span .e-searchfind e-icon')
            $searchBox.append($sapnDiv);
            var $listOuterDiv = ej.buildTag('div', '', { 'height': '228px' }, { id: this._id + "liScrollerDiv" })
            this._renderColumnChooserData(false);
            $listOuterDiv.append(this._columnChooserList);
            $outerDiv.append($searchBox);
            $outerDiv.append($listOuterDiv);

            var $splitterDiv = ej.buildTag('div .e-columnChooserSplitter', '', { 'border-bottom': '0px' });
            $outerDiv.append($splitterDiv);
            if (this.model.enableRTL) {
                $buttonDiv = ej.buildTag('div', '', { 'float': 'left', 'margin-top': '7px', 'margin-right': '-13px' });
                var $cancelButton = ej.buildTag("button", this.localizedLabels.Cancel, { 'margin-right': '7px', 'margin-left': '9px' });
                $($sapnDiv).addClass("e-rtl");
            }
            else {
                $buttonDiv = ej.buildTag('div', '', { 'float': 'right', 'margin-top': '7px', 'margin-right': '-13px' });
                var $cancelButton = ej.buildTag("button", this.localizedLabels.Cancel, { 'margin-right': '20px', 'margin-left': '6px' });
            }
            var $addButton = ej.buildTag("button", this.localizedLabels.Done);
            $buttonDiv.append($addButton);
            $buttonDiv.append($cancelButton);
            $outerDiv.append($buttonDiv);
            $addButton.ejButton({
                click: $.proxy(this._addButtonCC, this),
                showRoundedCorner: true,
                width: 66
            });
            $cancelButton.ejButton({
                click: $.proxy(this._cancelButtonHandler, this),
                showRoundedCorner: true,
                width: 66
            });
            $outerDiv.insertBefore(this.element)
            $outerDiv.ejDialog({ width: 'auto', beforeClose: $.proxy(this._columnChooserBeforeClose, this), showOnInit: false, allowKeyboardNavigation: false, enableResize: false, "enableRTL": this.model.enableRTL, "cssClass": this.model.cssClass, showHeader: false, width: 260 });
            if (ej.browserInfo().name == "msie" && ej.browserInfo().version < 10) {
                var searchBox = $(".e-columnChooser").find("input#" + this._id + "_ccSearchBox")[0];
                ej.ieClearRemover(searchBox);
            }
        },
        _renderColumnChooserData: function (refresh) {
            var selectAllCheck = this.model.columns.length == this.getVisibleColumnNames().length;            
            this._ccCheckBoxList = [];
            var $listBox = ej.buildTag("div", '', { 'margin-left': '0px', 'width': '250px' }), count = 0;
            for (var index = -1; index < this.model.columns.length; index++) {
                var isSelectAll = index == -1;
                if (isSelectAll || this.model.columns[index].showInColumnChooser) {
                    var column = this.model.columns[index];
                    var colValue = isSelectAll ? this.localizedLabels["SelectAll"] : ej.isNullOrUndefined(column.headerText) || column.headerText == "" ? column.field == "" ? null : column.field : column.headerText,
                        labelValue = column && column.disableHtmlEncode ? this._htmlEscape(colValue) : colValue;
                    if (!ej.isNullOrUndefined(colValue) || isSelectAll) {
                        var $innerDiv = ej.buildTag('div', '', {}, { 'class': 'e-columnChooserListDiv' });
                        var styleAttr = {};
                        var id = isSelectAll ? this._id + 'selectAll' : this._id + colValue.replace(/\s|\.|[^a-zA-Z0-9]|&nbsp/g, "_");
                        var inDom = $listBox.find("#" + id).length; inDom && count++;
                        var $input = ej.buildTag('input', '', styleAttr, { 'id': (!inDom ? id : id + count + ""), 'value': colValue, 'type': 'checkbox', "ej-field": isSelectAll ? '' : column.field, "ej-headertext": isSelectAll ? '' : column.headerText, 'class': isSelectAll ? 'e-selectall' : '' });
                        var label = ej.buildTag('label', labelValue, { 'font-size': '13px' }, { 'for': (!inDom ? id : id + count + "") });
                        $innerDiv.append($input);
                        $innerDiv.append(label);
                        $listBox.append($innerDiv);
                        var checked = !isSelectAll && !ej.isNullOrUndefined(column.visible) ? column.visible : true;
                        $input.ejCheckBox({
                            checked: isSelectAll ? selectAllCheck : checked,
                            change: $.proxy(this._columnChooserCheckChange, this)
                        });
                        if (!isSelectAll && !ej.isNullOrUndefined(column.visible))
                            $input[column.visible ? "attr" : "removeAttr"]("checked", true);
                    }
                }
            }
            if (!refresh)
                this._columnChooserList = $listBox;
            else {
                this._columnChooserList.empty().append($listBox.children());
                $("#" + this._id + "liScrollerDiv").is(":visible") && $("#" + this._id + "liScrollerDiv").ejScroller('refresh');
            }
            this._ccCheckBoxList = this._columnChooserList.find("input:checkbox.e-js").not(".e-selectall");
        },
        _checkFinder: function () {
            var $this = $(this), $parent = $this.closest(".e-columnChooserListDiv");
            if ($this.hasClass("e-checkbox") && !$parent.hasClass("e-hide") && $this.prop("checked"))
                return true;
        },
        _displayFinder: function () {            
            return !$(this).closest(".e-columnChooserListDiv").hasClass("e-hide");
        },
        _columnChooserCheckChange: function (args) {
            if (!args.isInteraction) {
                if (args.isChecked)
                    $("#" + this._id + "ccDiv").find("button[aria-describedby = '" + this.localizedLabels.Done + "']").removeClass("e-disable");
             return;
            }
            var checked = args.isChecked, displayedCheckBoxes = this._ccCheckBoxList.filter(this._displayFinder), checkedBoxes = this._ccCheckBoxList.filter(this._checkFinder),
                totalChecks = displayedCheckBoxes.length, checkedLen = checkedBoxes.length;
            if (args.model.id == this._id + 'selectAll') {
                if (!checked)
                    checkedBoxes.ejCheckBox({ checked: checked });                
                else           
                    displayedCheckBoxes.not(":checked").ejCheckBox({ checked: checked });                
            }
            else {
                this._columnChooserList.find('input.e-selectall').ejCheckBox('model.checked', totalChecks == checkedLen);
                checked = checkedLen != 0;
                this.element[checked ? "attr" : "removeAttr"]("checked", true);
            }
            var operation = !checked ? "addClass" : "removeClass";
            $("#" + this._id + "ccDiv").find("button[aria-describedby = '" + this.localizedLabels.Done + "']")[operation]("e-disable");
        },
        _columnChooserBeforeClose: function () {
            $(".e-columnChoosertail").remove();
            $(".e-columnChoosertailAlt").remove();
            $("#" + this._id + "ccDiv").find("button[aria-describedby = '" + this.localizedLabels.Done + "']").removeClass("e-disable");
            $("#" + this._id + "_ccSearchBox").val('');
            var args = {};
            args.target = {}; args.target.value = '';
            this._columnChooserSearch(args);
        },
        _columnChooserSearch: function (e) {
            if (e.type == 'click') {
                e.target.value = '';
                $("#" + this._id + "_ccSearchBox").val('');
            }
            var val = e.target.value;
            var span = $("#" + this._id + "_ccSearchBox").next('span');
            if (val != '') {
                span.removeClass("e-searchfind");
                span.addClass("e-cancel");
            }
            else {
                span.removeClass("e-cancel");
                span.addClass("e-searchfind");
            }
            $(".e-cancel").bind('click', $.proxy(this._columnChooserSearch, this));
            var currentCheckedItemsData = this.model.columns;
            var columnCollection = [], gridColumns = [], tempCollection = [], proxy = this, 
                isHiddenByGroup = function (field) {
                    var model = proxy.model.groupSettings;
                    return !model.showGroupedColumn && $.inArray(field, model.groupedColumns) > -1;
                };
            if (val != '') {
                currentCheckedItemsData = ej.DataManager(this.model.columns).executeLocal(ej.Query().where("headerText", ej.FilterOperators.startsWith, val, true));
                tempCollection = ej.DataManager(this.model.columns).executeLocal(ej.Query().where("field", ej.FilterOperators.startsWith, val, true));
                tempCollection.forEach(function (obj) {
                    if (obj.headerText == "" && $.inArray(obj, currentCheckedItemsData) == -1)
                        currentCheckedItemsData.push(obj);
                })
            }
             currentCheckedItemsData.forEach(function (obj) {
                 if (obj.showInColumnChooser && !isHiddenByGroup(obj.field)) {
                    var headerText = ej.isNullOrUndefined(obj.headerText) || obj.headerText == "" ? obj.field == "" ? null : obj.field : obj.headerText;
                    columnCollection.push(headerText);
                }
            });
            if (!ej.isNullOrUndefined($("#nomatches")[0]))
                $("#nomatches").remove();
            var div = $("#" + this._id + "ccDiv").find("#" + this._id + "liScrollerDiv")

            var divs = this._columnChooserList.find(".e-columnChooserListDiv");

            for (i = 0; i < this.model.columns.length; i++) {
                if (this.model.columns[i].showInColumnChooser && !ej.isNullOrUndefined(this.model.columns[i].headerText)) {
                    if (this.model.columns[i].headerText != "")
                        gridColumns.push(this.model.columns[i].headerText)
                    else if (this.model.columns[i].field != "")
                        gridColumns.push(this.model.columns[i].field)
                }
            }

            for (var index = 0; index < gridColumns.length; index++) {
                var colValue = gridColumns[index];
                var indx = columnCollection.indexOf(colValue)
                if (!ej.isNullOrUndefined(colValue))
                    divs.eq(index + 1)[indx == -1 ? "addClass" : "removeClass"]("e-hide");
            }

            if (columnCollection.length == 0) {
                var $labeldiv = ej.buildTag('div#nomatches', '', { 'padding-left': '13px' });
                var $label = ej.buildTag('span', this.localizedLabels.NoResult);
                $labeldiv.append($label);
                $(div).append($labeldiv);
            }
            var checkDisplay = this._ccCheckBoxList.filter(this._displayFinder).length, checkChecked = this._ccCheckBoxList.filter(this._checkFinder).length, isChk = checkChecked == checkDisplay;
            if (columnCollection.length)
                divs.eq(0).find("input.e-js").ejCheckBox({ checked: isChk });
            divs.eq(0)[columnCollection.length == 0 ? "addClass" : "removeClass"]("e-hide");
            $("#" + this._id + "ccDiv").find("button[aria-describedby = '" + this.localizedLabels.Done + "']")[!checkChecked ? "addClass" : "removeClass"]("e-disable");
            $("#" + this._id + "liScrollerDiv").ejScroller('refresh');
        },
        _addButtonCC: function () {
            this._visibleColumns = [];
            this._hiddenColumns = [];
            this._visibleColumnsField = [];
            this._hiddenColumnsField = [];
            this._columnChooserClick = true;
            var args = {}; args.requestType = "columnchooser";
			this._columnChooser = true;
            var chbxs = this._columnChooserList.find("input:checkbox.e-js").not('.e-selectall');
            for (var i = 0, len = chbxs.length; i < len; i++) {
                var ele = $(chbxs[i]), hTxt = ele.attr("ej-headertext"), field = ele.attr("ej-field");
                if(this._id+"selectAll"!=ele.attr("id")){
                    this[chbxs[i].checked ? "_visibleColumns" : "_hiddenColumns"].push(hTxt);
                    this[chbxs[i].checked ? "_visibleColumnsField" : "_hiddenColumnsField"].push(field != "" ? field : hTxt);
                }
            }
            var array1 = this._visibleColumns;
            var array2 = this._hiddenColumns;
            var arr = [], obj, duparr;
            obj = $.merge($.merge([], array1), array2);
            duparr = this._isDuplicate(obj);
            this._trigger("actionBegin", args);
            if (duparr) {
                this.showColumns(this._visibleColumnsField);
                this.hideColumns(this._hiddenColumnsField);
            }
            else {
                this.showColumns(this._visibleColumns);
                this.hideColumns(this._hiddenColumns);
            }
            $("#" + this._id + "ccDiv").ejDialog('close');
            $(".e-columnChoosertail").remove();
            this.refreshScrollerEvent();
            args = { requestType: "columnchooser", removedcolumns: [], addedcolumns: [], visiblecolumns: this.getVisibleColumnNames(), hiddencolumns: this.getHiddenColumnNames() };
            this._ccColumnUpdate(args.addedcolumns, this.getVisibleColumnNames(), this._ccVisibleColumns);
            this._ccColumnUpdate(args.removedcolumns, this.getHiddenColumnNames(), this._ccHiddenColumns);
            this._trigger("actionComplete", args);
        },
        _ccColumnUpdate: function (args, getColumns, ccColumns) {
            for (i = 0; i < getColumns.length; i++) {
                if ($.inArray(getColumns[i], ccColumns) == -1)
                    args.push(getColumns[i]);
            }
        },
        _isDuplicate: function (arr) {
            var temp, count = [], duplicate = [];
            for (var i = 0; i < arr.length; i++) {
                temp = arr[i];
                if (count[temp] >= 1)
                    count[temp] = count[temp] + 1;
                else
                    count[temp] = 1;
            }
            for (temp in count) {
                if (count[temp] > 1)
                    return true;
            }
            return false;
        },
        _cancelButtonHandler: function () {
            $("#" + this._id + "ccDiv").ejDialog('close');
            $(".e-columnChoosertailAlt").remove();
            $(".e-columnChoosertail").remove();
        },
        _ccClickHandler: function (e) {
            var dlgWidth = 230, xPos;
            var chooserButton = this.element.find(".e-ccButton");
            xPos = chooserButton.offset().left + chooserButton.width();
            var dialogObj = $("#" + this._id + "ccDiv").data('ejDialog')
            if (dialogObj && dialogObj.isOpened()) {
                dialogObj.close();
                $(".e-columnChoosertail").remove();
                $(".e-columnChoosertailAlt").remove();
            }
            else {
                $("#" + this._id + "ccDiv").ejDialog({ width: '230px', height: '309px', position: { X: (this.model.enableRTL ? (xPos - dlgWidth + 143) : (xPos - dlgWidth)), Y: chooserButton.offset().top + 35 } })
                   .ejDialog("open");
                var maxZindex = parseInt($("#" + this._id + "ccDiv_wrapper").css('z-index'));
                var $tailDiv = ej.buildTag("div #" + this._id + "_ccTail .e-columnChoosertail", '', { 'display': 'block', 'position': 'absolute', 'left': (this.model.enableRTL ? (xPos - 78) : (xPos - 29)), 'top': chooserButton.offset().top + 15 });
                var $tailDiv2 = ej.buildTag("div #" + this._id + "_ccTailAlt .e-columnChoosertailAlt", '', { 'display': 'block', 'z-index': maxZindex + 2, 'position': 'absolute', 'left': (this.model.enableRTL ? (xPos - 78) : (xPos - 29)), 'top': chooserButton.offset().top + 16 });
                $tailDiv.insertBefore($("#" + this._id + "ccDiv_wrapper"));
                $tailDiv2.insertBefore($("#" + this._id + "ccDiv_wrapper"));
            }
            this._refreshColumnChooserList();
            this._ccVisibleColumns = this.getVisibleColumnNames();
            this._ccHiddenColumns = this.getHiddenColumnNames();
            $("#" + this._id + "liScrollerDiv").ejScroller({ height: '228', width: '228', buttonSize: 0 });
            $("#" + this._id + "liScrollerDiv").ejScroller('refresh');
            if (this.getBrowserDetails().browser == 'chrome')
                $('.e-columnChooser .e-hscrollbar').attr('style', 'height: 10px !important;');
            $(".e-ejinputtext").bind('keyup', $.proxy(this._columnChooserSearch, this))
        },
        _refreshColumnChooserList: function (collection) {
            var chbxs = this._columnChooserList.find("input:checkbox.e-js").not('.e-selectall');
			var duparr = this._isDuplicate($.merge($.merge([], this._visibleColumns), this._hiddenColumns));
            for (var i = 0, len = chbxs.length; i < len; i++) {
                var ele = $(chbxs[i]), hTxt = ele.attr("ej-headertext"), field = ele.attr("ej-field"), flag = undefined, isDup = chbxs.filter("[ej-headertext='" + hTxt + "']").length;
                if (this.model.allowGrouping && !this.model.groupSettings.showGroupedColumn && $.inArray($(chbxs[i]).attr("ej-field"), this.model.groupSettings.groupedColumns) != -1) {
                    $(chbxs[i]).parents(".e-columnChooserListDiv").addClass("e-hide");
                    chbxs[i].checked = false;
                }
                else {
                    $(chbxs[i]).parents(".e-columnChooserListDiv").removeClass("e-hide");
                    chbxs[i].checked = true;
                }
                var colValue = duparr ? (field == "" ? hTxt : field) : hTxt;
				flag = this[duparr ? "_hiddenColumnsField" : "_hiddenColumns"].indexOf(colValue) != -1;
                ele[!flag ? "attr" : "removeAttr"]("checked", true);
                ele.ejCheckBox("model.checked", !flag);
            }
            this._columnChooserList.find("input:checkbox.e-selectall").ejCheckBox({ checked: chbxs.filter(this._displayFinder).length == chbxs.filter(this._checkFinder).length });
        },
        _initDataSource: function () {
            this._isLocalData = (!(this._dataSource() instanceof ej.DataManager) || (this._dataSource().dataSource.offline || this._isRemoteSaveAdaptor || this._dataSource().adaptor instanceof ej.ForeignKeyAdaptor));
            this._ensureDataSource();
            this._trigger("actionBegin");
            var queryPromise = this._dataSource().executeQuery(this.model.query), subPromises, proxy = this;
            if (this._dataManager.dataSource.table != null)
                this._dataManager.dataSource.table.css("display", "none");
            if (!this.element.is(":visible"))
                this.element.ejWaitingPopup("hide");
            queryPromise.done(ej.proxy(function (e) {
                this._relationalColumns.length == 0 && this.element.ejWaitingPopup("hide");
                if (!this.model.columns.length && !e.count) {
                    var lastPage = (e.count % this.model.pageSettings.pageSize == 0) ? (e.count / this.model.pageSettings.pageSize) : (parseInt(e.count / this.model.pageSettings.pageSize, 10) + 1);
                    if (this._currentPage() > lastPage)
                        this._currentPage(lastPage);
                    proxy._renderAlertDialog();
                    proxy._alertDialog.find(".e-content").text(proxy.localizedLabels.EmptyDataSource);
                    proxy._alertDialog.ejDialog("open");
                    proxy.element.ejWaitingPopup("hide");
                    return;
                }
                if (!ej.isNullOrUndefined(e.aggregates))
                    this._remoteSummaryData = e.aggregates;
				if(!this.model.scrollSettings.enableVirtualization)
				    this.model.currentViewData = e.result;
				if (this._$fkColumn && this.model.filterSettings.filteredColumns.length > 0 && this.model.filterSettings.filterType == "excel")
				    this._fkParentTblData = e.result;
				if (!this.model.enablePersistence && this.model.pageSettings.totalRecordsCount != null && this.model.filterSettings.filteredColumns.length == 0)
                    this._gridRecordsCount = this.model.pageSettings.totalRecordsCount;
                else if (e.count == 0 && e.result.length)
                    this._gridRecordsCount = e.result.length;
                else
                    this._gridRecordsCount = e.count;
                if (this.model.filterSettings.filteredColumns.length > 0)
                    this._filteredRecordsCount = e.count;
                if (this.getPager() != null)
                    this.model.pageSettings.totalRecordsCount = this._gridRecordsCount;
				if(this.model.allowScrolling && this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){
					this._refreshVirtualViewDetails();
					if(this._isInitNextPage || this._remoteRefresh){					
						this._setInitialCurrentIndexRecords(e.result, this._currentPage());							
						this._isInitNextPage = this._remoteRefresh = false;
					}
					else
						this._setVirtualLoadedRecords(e.result, this._currentPage());					
					if(this._isThumbScroll && !this._checkCurrentVirtualView(this._virtualLoadedRecords, this._currentVirtualIndex))
						this._checkPrevNextViews(this._currentPage()); 										
					if(this.initialRender){												
						this.model.currentViewData = [];
						for (var i = 0; i < this._currentLoadedIndexes.length; i++) {
							var currentView = this._currentLoadedIndexes[i];
							$.merge(this.model.currentViewData, this._virtualLoadedRecords[currentView]);
						}            
					}
					else						
						this.model.currentViewData = e.result;					
                }
				this._setForeignKeyData();
				this._relationalColumns.length == 0 && this._initGridRender();
            }, this));
            var proxy = this;
            queryPromise.fail(function (e) {
                var args = { error: e.error };
                proxy._trigger("actionFailure", args)
            })
        },
        _initialRenderings: function () {
            if (this.model.groupSettings.groupedColumns.length) {
                var sortedColumns = new Array();
                for (var i = 0; i < this.model.sortSettings.sortedColumns.length; i++) {
                    if (ej.isNullOrUndefined(this.model.sortSettings.sortedColumns[i].direction))
                        this.model.sortSettings.sortedColumns[i].direction = ej.sortOrder.Ascending;
                    sortedColumns.push(this.model.sortSettings.sortedColumns[i].field);
                }
                if(this.model.allowGrouping){
					for (var i = 0; i < this.model.groupSettings.groupedColumns.length; i++) {
						if ($.inArray(this.model.groupSettings.groupedColumns[i], sortedColumns) == -1)
							this.model.sortSettings.sortedColumns.push({ field: this.model.groupSettings.groupedColumns[i], direction: ej.sortOrder.Ascending });
					}
                }
            }
        },
        _getExpands: function (field, arr) {
            var splits = field.split('.'), tmp = "";
            splits.splice(splits.length - 1, 1);
            for (var i = 0; i < splits.length; i++, tmp = "") {
                for (var j = 0; j < i; j++)
                    tmp += splits[j] + "/";
                tmp = tmp + splits[i];
                if (arr.indexOf(tmp) === -1)
                    arr.push(tmp);
            }
        },
        _renderAfterColumnInitialize: function () {
            this.element.append(this._renderGridHeader());
            if (this.model.allowFiltering && this.model.filterSettings.filterType == "filterbar") {
                this._renderFiltering();
                this._renderFilterBarTemplate();
            }
			if(this.model.gridLines != "both")
				this._showHeaderGridLines();
            if (this.model.allowPaging)
                this.element.append(this.element.find(".e-pager").first());
        },
        _ensureDataSource: function (args) {
            if (this._dataSource() == null && !(this._dataSource() instanceof ej.DataManager)) {
                if (!ej.isNullOrUndefined(args) && args.requestType == "add")
                    this.dataSource([]);
                else
                    return;
            }
            this.model.query.requiresCount();
            var queryManagar = this.model.query;
            var cloneQuery = queryManagar.clone();
            if (!(this._dataSource() instanceof ej.DataManager))
                this.model.currentViewData = this._dataSource();
            if (this._isLocalData && (this.model.editSettings.allowEditing || this.model.editSettings.allowAdding) && (!ej.isNullOrUndefined(this._cModifiedData) || !ej.isNullOrUndefined(this._cAddedRecord))) {
                if (ej.isNullOrUndefined(this._cAddedRecord)) {
                    for (var index = 0; index < this._primaryKeys.length; index++)
                        queryManagar = queryManagar.where(this._primaryKeys[index], ej.FilterOperators.equal, this._primaryKeyValues[index]);
                    var currentData = this._dataManager.executeLocal(queryManagar);
                    if (!(this._dataSource() instanceof ej.DataManager))
                        $.extend(this._dataSource()[$.inArray(currentData.result[0], this._dataSource())], this._cModifiedData);
                    else
                        $.extend(this._dataSource().dataSource.json[$.inArray(currentData.result[0], this._dataSource().dataSource.json)], this._cModifiedData);
                    this._cModifiedData = null;
                } else {
                    var tmpRcrd = this._cAddedRecord;
                    this._cAddedRecord = null;
                    (this._dataSource() instanceof ej.DataManager) ? this._dataSource().dataSource.json.unshift(tmpRcrd) : this._dataSource(undefined, true).splice(0, 0, tmpRcrd);
                }
                queryManagar.queries = cloneQuery.queries;
                if (!(this.model.editSettings.showAddNewRow && this.model.editSettings.editMode == "normal"))
                    this.model.isEdit = false;
            }
            if (args && this.model.editSettings.allowDeleting && args.requestType == "delete" && (this._excludeDetailRows().length == 1 || (this.multiDeleteMode == "multiple" && this.selectedRowsIndexes.length == this._excludeDetailRows().length)) && this.model.pageSettings.currentPage != 1)
                this._currentPage(this.model.pageSettings.totalPages - 1)
            if (args && this.model.editSettings.allowDeleting && args.requestType == "delete" && !ej.isNullOrUndefined(this._cDeleteData) && this._isLocalData) {
                if (!(this._dataSource() instanceof ej.DataManager)) {
                    var index = $.inArray(this._cDeleteData[0], this._dataSource());
                    this._dataSource(undefined, true).splice(index, 1);
                }
                else {
                    var index = $.inArray(this._cDeleteData[0], this._dataSource().dataSource.json);
                    this._dataSource().dataSource.json.splice(index, 1);
                }
            }
            if (this.model.sortSettings.sortedColumns.length) {
                 var sortedGrp = [], sortedColumns = this.model.sortSettings.sortedColumns;
                for (var i = sortedColumns.length - 1; i >= 0; i--){
                    if(this.model.groupSettings.groupedColumns.indexOf(sortedColumns[i].field) == -1){
                        queryManagar.sortBy(sortedColumns[i].field, sortedColumns[i].direction);
						if(this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization && $.inArray(sortedColumns[i], this._prevVirtualSort) == -1){
							for(var j = 0; j < this._prevVirtualSort.length; j++){
								if(sortedColumns[i].field == this._prevVirtualSort[j].field)
									this._prevVirtualSort.splice(j, 1);
							}
							this._needVPaging = this._currentVirtualIndex * this._virtualRowCount % this.model.pageSettings.pageSize <= this._virtualRowCount;
							this._prevVirtualSort.push(sortedColumns[i]);	
							this._virtualDataRefresh = true;
							this._refreshVirtualViewData();							
						}
					}
                    else
                        sortedGrp.push({field: sortedColumns[i].field, direction: sortedColumns[i].direction })
				}
                for (var j = 0; j < sortedGrp.length ; j++){
                    queryManagar.sortBy(sortedGrp[j].field, sortedGrp[j].direction);
                }
            }

            if (this.model.allowSearching && this.model.searchSettings.key.length) {
                var searchDetails = this.model.searchSettings;
                searchDetails.fields = searchDetails.fields.length != 0 ? searchDetails.fields : this.getColumnFieldNames();
                queryManagar.search(searchDetails.key ,searchDetails.fields, searchDetails.operator || "contains", searchDetails.ignoreCase || true);
                if (!this.initialRender && args.requestType == "searching")
                    this._currentPage(1);
            }
            if (this._isLocalData && this.model.allowSearching)
                this._filteredRecords = this.model.searchSettings.key.length != 0 ? this._dataManager.executeLocal(queryManagar).result : [];
            if (this.model.allowFiltering && this.model.filterSettings.filteredColumns.length) {
                var predicate, firstFilterCondition = this.model.filterSettings.filteredColumns[0];
				var filteredColumns = this.model.filterSettings.filteredColumns;
                if (this._isExcelFilter || this._excelFilterRendered) {
                    this._excelFilter.getPredicate(filteredColumns, null, true);
                    var predicates = this._excelFilter._predicates[0];
                    for (var prop in predicates) {
                        var obj = predicates[prop], isTake = obj["from"] != undefined;
                        if (isTake)
                            queryManagar.skip(obj["from"] == "top" ? 0 : this._gridRecordsCount - obj["take"]).take(obj["take"]);
                        else
                            predicate = predicate != undefined ? predicate["and"](obj) : obj;
                    }
                }
                else {
                    if (!(firstFilterCondition instanceof ej.Predicate))
                        predicate = ej.Predicate(firstFilterCondition.field, firstFilterCondition.operator, firstFilterCondition.value, !firstFilterCondition.matchcase);
                    else
                        predicate = firstFilterCondition;
                    for (var i = 1; i < filteredColumns.length; i++) {
                        if (!(filteredColumns[i] instanceof ej.Predicate)) {
                            if (!this._isLocalData && filteredColumns.length > 2 && i > 1 && filteredColumns[i].predicate == "or")
                                predicate.predicates.push(ej.Predicate(filteredColumns[i].field, filteredColumns[i].operator, filteredColumns[i].value, filteredColumns[i].ignoreCase || !filteredColumns[i].matchcase));
                            else
                                predicate = predicate[filteredColumns[i].predicate || "and"](filteredColumns[i].field, filteredColumns[i].operator, filteredColumns[i].value, !filteredColumns[i].matchcase);
                        }
                        else
                            predicate = predicate[filteredColumns[i].predicate || "and"](filteredColumns[i]);
                    }
                }
                predicate && queryManagar.where(predicate);
                if (this._isLocalData) {
                    var fresults = this._dataManager.executeLocal(queryManagar);
                    this._filteredRecordsCount = isTake ? fresults.result.length : fresults.count;
                    var lastPage = (this._filteredRecordsCount % this.model.pageSettings.pageSize == 0) ? (this._filteredRecordsCount / this.model.pageSettings.pageSize) : (parseInt(this._filteredRecordsCount / this.model.pageSettings.pageSize, 10) + 1);
                    if (this._currentPage() > lastPage)
                        this._currentPage(lastPage);
                    this._filteredRecords = this._dataManager.executeLocal(queryManagar).result;
                    if (this._$fkColumn && this.model.filterSettings.filteredColumns.length > 0 && this.model.filterSettings.filterType == "excel")
                        this._fkParentTblData  = this._filteredRecords;
                } else if (!ej.isNullOrUndefined(args) && args.requestType == ej.Grid.Actions.Filtering)
                    this._currentPage(1);
				if(this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){
					for(var i = 0; i < filteredColumns.length; i++){
						for(var j = 0; j < this._prevVirtualFilter.length; j++){
							if(filteredColumns[i] == this._prevVirtualFilter[j] && args.requestType == ej.Grid.Actions.Filtering)
								this._prevVirtualFilter.splice(j, 1);
						}
						if($.inArray(filteredColumns[i], this._prevVirtualFilter) == -1){
							this._prevVirtualFilter.push(filteredColumns[i]);	
							this._gridRecordsCount = this._filteredRecordsCount;
							this._refreshViewPageDetails();							
							this._refreshVirtualViewData();
							this._refreshVirtualViewDetails();							 
						}
					}
				}
            }
			if (this._isLocalData && this.model.allowFiltering && this.model.filterSettings.filteredColumns.length==0){
				if(!ej.isNullOrUndefined(this._filteredRecordsCount) || this._filteredRecordsCount > 0){
					if(this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization){
						this._refreshViewPageDetails();
						this._refreshVirtualViewDetails(true);						
					}
					this._filteredRecordsCount = null;
					this._filteredRecords = [];
				}
			}

            if (this.model.summaryRows.length) {
                this._setSummaryAggregate(queryManagar);
            }

            if (this.model.allowPaging || (this.model.scrollSettings.allowVirtualScrolling && this.model.allowScrolling && !this.model.scrollSettings.enableVirtualization)) {
                if (this._isLocalData) {
                    var fresults = this._dataManager.executeLocal(queryManagar);
                    this._recordsCount = fresults.count;
                    var lastPage = (this._recordsCount % this.model.pageSettings.pageSize == 0) ? (this._recordsCount / this.model.pageSettings.pageSize) : (parseInt(this._recordsCount / this.model.pageSettings.pageSize, 10) + 1);
                    if (this._currentPage() > lastPage)
                        this._currentPage(lastPage);
                }
                if (this._currentPage() == 0) {
                    if (this._prevPageNo == 0 || this._prevPageNo == null)
                        this._currentPage(1);
                    else
                        this._currentPage(this._prevPageNo);
                }
                
                queryManagar.page(this._currentPage(), this.model.pageSettings.pageSize);
            }
			
			 if (this.model.allowScrolling && this.model.scrollSettings.allowVirtualScrolling && this.model.scrollSettings.enableVirtualization) {                              
                this._needPaging = true; 				
                if (this.initialRender && this.model.currentIndex > 1 && (this.model.currentIndex <= this._getVirtualTotalRecord() || !this._isLocalData)) { 					
					if(this.model.scrollSettings.virtualScrollMode == "continuous")
						this.model.currentIndex = 1;
                    this._currentVirtualIndex = Math.ceil(this.model.currentIndex / this._virtualRowCount);
                    this._isThumbScroll = true;
                    this._currentPage(Math.ceil(this.model.currentIndex / this.model.pageSettings.pageSize));
					this._virtualLoadedPages.push(this._currentPage());
                }
				if(this._virtualDataRefresh){					
                    this._isThumbScroll = true;
					this._refreshVirtualViewData(true);
					this._gridRecordsCount = this._dataSource() !== null ? (this.model.pageSettings.totalRecordsCount == null ? this._dataSource().length : this.model.pageSettings.totalRecordsCount) : 0;
                    this._currentPage(Math.ceil(this._currentVirtualIndex * this._virtualRowCount / this.model.pageSettings.pageSize));
					this._virtualLoadedPages.push(this._currentPage());					
				}
                if(this.model.virtualLoading != null)
                    this._gridRecordsCount = this.model.pageSettings.totalRecordsCount;
				if(this.model.filterSettings.filteredColumns == 0 && this._prevVirtualFilter.length){
					this._refreshVirtualViewData();
					this._prevVirtualFilter = [];
				}									
				if(this._isLocalData && this.initialRender)
					this._refreshVirtualViewDetails();								
				this._getVirtualLoadedRecords(queryManagar);
            }	

            if (this.model.allowGrouping) {
                var cloned = queryManagar.clone();
                if (this.model.allowPaging && this.model.groupSettings.groupedColumns.length) {
                    cloned.queries = cloned.queries.slice(0, cloned.queries.length - 1);
                }
                for (var i = 0; i < this.model.groupSettings.groupedColumns.length; i++) {
                    queryManagar.group(this.model.groupSettings.groupedColumns[i]);
                    cloned.group(this.model.groupSettings.groupedColumns[i]);
                }
                if (this.model.groupSettings.groupedColumns.length)
                    this._setAggreatedCollection(cloned);
            }
            if (args != undefined && args.requestType == "add" && this._isLocalData && this.model.groupSettings.groupedColumns.length == 0 && this.model.scrollSettings.frozenColumns == 0 && this.model.scrollSettings.frozenRows == 0)
                !(this._dataSource() instanceof ej.DataManager) ? this._dataSource().unshift(args.data) : this._dataSource().dataSource.json.unshift(args.data);
            if ((!ej.isNullOrUndefined(args) && args.action == "add") && !ej.isNullOrUndefined(this.model.parentDetails)) {
                var column = this.getColumnByField(this.model.parentDetails.parentKeyField);
                var ix = $.inArray(column, this.model.columns)
                if (ix == -1) {
                    var newdata = {};
                    newdata[this.model.parentDetails.parentKeyField] = this.model.parentDetails.parentKeyFieldValue;
                    $.extend(true, this.model.currentViewData[0], newdata);
                }
            }
            this._cloneQuery = queryManagar.clone();
                if (this._isLocalData && (!this.model.scrollSettings.enableVirtualization || this._virtualDataRefresh)) {
                var dataMgrJson = this._dataManager.dataSource.json;
                var dataSource = this._dataSource().dataSource;
                if (!ej.isNullOrUndefined(dataSource) && this._dataSource() instanceof ej.DataManager)
                    this._dataManager.dataSource.json = dataMgrJson != dataSource.json ? dataSource.json : dataMgrJson;
                var result = this._dataManager.executeLocal(queryManagar);
                if (this.model.scrollSettings.allowVirtualScrolling && this.model.pageSettings.currentPage == this.model.pageSettings.totalPages - 1)
                    this._prevPageRendered = true;
                if (this.model.scrollSettings.allowVirtualScrolling && !this._prevPageRendered && result.result.length != this.model.pageSettings.pageSize && this.model.pageSettings.totalPages == this.model.pageSettings.currentPage) {
                    var pageQuery = ej.pvt.filterQueries(queryManagar.queries, "onPage");
                    queryManagar.queries.splice($.inArray(pageQuery[0], queryManagar.queries), 1);
                    queryManagar.page(this._currentPage() - 1, this.model.pageSettings.pageSize);
                    var lastPageResult = this._dataManager.executeLocal(queryManagar);
                    lastPageResult.result.splice(0, result.result.length);
                    this._previousPageRecords = $.extend(true, [], lastPageResult.result);
                    this._previousPageLength = result.result.length;
                    this._currentPageData = result.result;
                    ej.merge(lastPageResult.result, result.result);
                    this.model.currentViewData = lastPageResult.result;
                    this._lastPageRendered = true;
                }
                else if (this._lastPageRendered && this.model.pageSettings.currentPage == this.model.pageSettings.totalPages - 1 && !this.model.scrollSettings.enableVirtualization) {
                    var count = this.model.pageSettings.pageSize - this._previousPageLength;
                    for (var dupRow = 0; dupRow < count; dupRow++) {
                        var removeEle = this.getRows()[this.getRows().length - (this.model.pageSettings.pageSize - dupRow)];
                        removeEle.remove();
                    }
                    this._tempPageRendered = true;
                    this.model.currentViewData = result.result;
                }
                else
                    this.model.currentViewData = result.result;
                this._gridRecordsCount = result.count;
                this._remoteSummaryData = result.aggregates;
                this._searchCount = this._searchString.length ? result.count : null;
                this.model.groupSettings.groupedColumns.length && this._setAggregates();
            }
        },
		_refreshViewPageDetails: function(){
			this._currentPage(1);
			this.model.currentIndex = 0;
			this._currentVirtualIndex = 1;
			this.getContent().ejScroller("model.scrollTop", 0);
		},
		_refreshVirtualViewDetails: function(dataRefreshed){
			if(dataRefreshed)
				this._gridRecordsCount = this._dataSource() !== null ? this._dataSource().length : this.model.pageSettings.totalRecordsCount;
			this._totalVirtualViews = Math.ceil(this._getVirtualTotalRecord() / this._virtualRowCount);
			this._maxViews = Math.ceil(this.model.pageSettings.pageSize / this._virtualRowCount);			
			this.model.pageSettings.totalPages = Math.ceil(this._gridRecordsCount / this.model.pageSettings.pageSize);
			this.model.pageSettings.totalRecordsCount = this._gridRecordsCount;			
			this._lastViewData = this._virtualRowCount - ((this._totalVirtualViews * this._virtualRowCount) - this._getVirtualTotalRecord());		
		},
		_getVirtualLoadedRecords: function (queryManagar) {                                        
            var currentPage = this._currentPage();
			if (this._needPaging){
				this._isLastVirtualpage = needTwoPage = this._isThumbScroll && currentPage == this.model.pageSettings.totalPages && !this._virtualPageRecords[currentPage];				
				if(this.initialRender || this._virtualDataRefresh) needTwoPage = true;
				if (this.model.virtualLoading && this._isLocalData && (this.model.currentIndex != 0 || currentPage != 1) && this.model.currentIndex < this.model.pageSettings.totalRecordsCount)
					this._getVirtualOnLoadingData(currentPage, !needTwoPage);
				else
					this._setVirtualPaging(queryManagar, currentPage, !needTwoPage);
				if(!this.initialRender && this._isThumbScroll && this._virtualPageRecords[currentPage] && !this._virtualDataRefresh)
					this._checkPrevNextViews(currentPage, queryManagar);
			}		                            
			this._needPaging = false;			
            this._setVirtualLoadedIndexes(this._currentVirtualIndex);
            if(this.initialRender && this._isLocalData){
                this.model.currentViewData = [];
                for (var i = 0; i < this._currentLoadedIndexes.length; i++) {
                    var currentView = this._currentLoadedIndexes[i];
					if(this._virtualLoadedRecords[currentView])
						$.merge(this.model.currentViewData, this._virtualLoadedRecords[currentView]);
                }
            }
        },
        _setVirtualPaging: function(queryManagar, currentPage, isCurrentIndex){     
            var pageQuery = ej.pvt.filterQueries(queryManagar.queries, "onPage");
			if(pageQuery.length)
				queryManagar.queries.splice($.inArray(pageQuery[0], queryManagar.queries), 1);
			if((!isCurrentIndex || this._needVPaging) && this.model.currentIndex > this._virtualRowCount){
				this._initCurrentIndex(queryManagar, currentPage);	
				this._needVPaging = false;
			}
			else
				queryManagar.page(currentPage, this.model.pageSettings.pageSize);
            if(this._isLocalData && !this._virtualPageRecords[currentPage]) {								 
				var result = this._dataManager.executeLocal(queryManagar);   
				if(!this.initialRender) this.model.currentViewData = result.result;
				if(result.result.length){
					this._setVirtualLoadedRecords(result.result, currentPage);					
					if($.inArray(currentPage, this._virtualLoadedPages) == -1)
						this._virtualLoadedPages.push(currentPage);
				}
				else
					this.getContent().find(".e-virtualtop, .e-virtualbottom").remove();					
			}                   						
        },
		_checkPrevNextViews: function(currentPage){
			var currentVirtualIndex = this._currentVirtualIndex;
			var prevView = this._virtualLoadedRecords[currentVirtualIndex - 1], nextView = this._virtualLoadedRecords[currentVirtualIndex + 1];			
				var adjust = this._maxViews == 3 ? 1 : 2, sTop;																	
				if(currentVirtualIndex != 1 && currentVirtualIndex != this._totalVirtualViews){				
					if(!prevView || prevView.length != this._virtualRowCount){
						var currentIndex = currentVirtualIndex + adjust;
						this._currentVirtualIndex = this._virtualLoadedRecords[currentVirtualIndex] ? currentIndex : currentIndex + 1;
						sTop = this._scrollValue + (adjust * this._virtualRowCount * this._vRowHeight);
					}
					else if((!nextView || nextView.length != this._virtualRowCount) && this._totalVirtualViews != currentVirtualIndex - 1){
						var currentIndex = currentVirtualIndex - adjust;
						this._currentVirtualIndex = this._virtualLoadedRecords[currentVirtualIndex] ? currentIndex : currentIndex - 1;
						sTop = this._scrollValue - (adjust * this._virtualRowCount * this._vRowHeight);
					}			
					if(sTop){					
						this._scrollValue = sTop;
						this._setVirtualLoadedIndexes(this._currentVirtualIndex);
						this.model.currentIndex = sTop == 0 ? sTop : Math.floor(sTop / this._vRowHeight);
					}
				}			
		},
		_initCurrentIndex: function(queryManagar, currentPage){			
			var pageResultCount = currentPage * this.model.pageSettings.pageSize;
			var nextDataCount = (this._currentVirtualIndex * this._virtualRowCount) + this._virtualRowCount;
			var prevDataCount = (this._currentVirtualIndex *  this._virtualRowCount) - (this._virtualRowCount * 2);	
			var needTwoPage = nextDataCount > pageResultCount || prevDataCount < pageResultCount - this.model.pageSettings.pageSize;
			if(needTwoPage || this._isLastVirtualpage){
				if(nextDataCount > pageResultCount){
					var skipValue = (currentPage - 1) * this.model.pageSettings.pageSize, takeValue = this.model.pageSettings.pageSize * 2;	
					this._isInitNextPage = true;					
				}
				else if(prevDataCount < pageResultCount - this.model.pageSettings.pageSize  || this._isLastVirtualpage){
					var skipValue = (currentPage - 2) * this.model.pageSettings.pageSize, takeValue = this.model.pageSettings.pageSize * 2;
					this._isInitNextPage = false; this._remoteRefresh = true;					
				}
				if(this.model.virtualLoading && this._isLocalData){
					var args = {};					
					args.endIndex = skipValue + takeValue;
					args.endIndex = args.endIndex > this._getVirtualTotalRecord() ? this._getVirtualTotalRecord() : args.endIndex;
					args.startIndex = skipValue;	
					args.currentPage = this._currentPage();
					args.result = null;
					this._trigger("virtualLoading", args);
					var currentData = args.result;
					this._setInitialCurrentIndexRecords(currentData, currentPage);
				}
				else{
					queryManagar.skip(skipValue).take(takeValue);					
					if(this._isLocalData){
						var result = this._dataManager.executeLocal(queryManagar);                                    
						var currentData = result.result; 
						this._isLastVirtualpage = false;
						this._setInitialCurrentIndexRecords(currentData, currentPage);						
					}
				}
			}			
			else{
				this._needVPaging = false;
				if(this.model.virtualLoading && this._isLocalData && (this.model.currentIndex != 0 || currentPage != 1))
					this._getVirtualOnLoadingData(currentPage, true);
				else
					this._setVirtualPaging(queryManagar, currentPage, true);						
			}
		},
		_setInitialCurrentIndexRecords: function(currentData, currentPage){
			for(i = 0; i < 2; i++){
				var start = i * this.model.pageSettings.pageSize, end = start + this.model.pageSettings.pageSize;
				var data = currentData.slice(start, end), page;
				if(this._isInitNextPage)
					page = i == 0 ? currentPage : currentPage + 1;
				else
					page = i == 0 ? currentPage - 1 : currentPage;
				this._setVirtualLoadedRecords(data, page);
			}
		},
        _getVirtualOnLoadingData: function(currentPage, isCurrentIndex){
            if(currentPage > 0){
				if(this.model.currentIndex > this._virtualRowCount && (!isCurrentIndex || this._needVPaging) && this.model.currentIndex < this.model.pageSettings.totalRecordsCount)
					this._initCurrentIndex(undefined, currentPage);
				else{
					var args = {};
					args.endIndex = (currentPage * this.model.pageSettings.pageSize) > this._gridRecordsCount ? this._gridRecordsCount : currentPage * this.model.pageSettings.pageSize;
					args.startIndex = (currentPage * this.model.pageSettings.pageSize) - this.model.pageSettings.pageSize;
					args.currentPage = this._currentPage();	args.result = null;			
					this._trigger("virtualLoading", args);
					var currentData = args.result;
					this._setVirtualLoadedRecords(currentData, currentPage);
				}
            }
        },
        _setVirtualLoadedRecords: function(currentData, currentPage){
            var virtualRowCount = this._virtualRowCount, pageSize = this.model.pageSettings.pageSize; 
            var pageIndex = pageSize / virtualRowCount, prevIndex;  
			var maxIndex = Math.ceil(currentPage * pageSize / virtualRowCount);
			var lastPage = currentPage == this.model.pageSettings.totalPages;
			if(!this._virtualPageRecords[currentPage])
				this._virtualPageRecords[currentPage] = currentData;
			if(lastPage){									
			    var lastPageData = this._getVirtualTotalRecord() % pageSize;
				if((!this._virtualLoadedRecords[this._totalVirtualViews] || this._virtualLoadedRecords[this._totalVirtualViews].length != this._lastViewData) && lastPageData < this._lastViewData && lastPageData != 0)
					maxIndex = this._totalVirtualViews + 1;
				else
					maxIndex = this._totalVirtualViews;	
				if(this._getVirtualTotalRecord() < virtualRowCount)
					this._singleView = true;
			}						
            for (var i = 0; i < pageIndex; i++) {
                var startIndex, endIndex;                                                      
                var viewIndex = Math.ceil((currentPage - 1) * pageIndex + (i + 1));				
                if((viewIndex <= this._totalVirtualViews || lastPage) && viewIndex <= maxIndex){					
                    if(this._virtualLoadedRecords[viewIndex - 1] && this._virtualLoadedRecords[viewIndex - 1].length != virtualRowCount) {
                        var start = this._virtualLoadedRecords[viewIndex - 1].length + (i * virtualRowCount);
                        startIndex = virtualRowCount - start + (i * virtualRowCount);
                        $.merge(this._virtualLoadedRecords[viewIndex - 1], currentData.slice(0, startIndex));
                        prevIndex = endIndex = startIndex + virtualRowCount;
						if(viewIndex <= this._totalVirtualViews)
							this._virtualLoadedRecords[viewIndex] = currentData.slice(startIndex, prevIndex);						
                    }									
                    else {
                        if (viewIndex != 1 && !this._virtualLoadedRecords[viewIndex - 1]) {                                        
                            var prevEnd = endIndex = (viewIndex - 1) * virtualRowCount % pageSize;
                            if(prevEnd != 0)
                                this._virtualLoadedRecords[viewIndex - 1] = currentData.slice(0, prevEnd);
                            startIndex = prevEnd, endIndex = prevIndex = prevEnd + virtualRowCount;
                        }
                        else {
                            startIndex = prevIndex ? prevIndex : i * virtualRowCount % pageSize;       
                            prevIndex = endIndex = startIndex + virtualRowCount;
                        }                                   
                    }                    
					if(this._virtualLoadedRecords[viewIndex] && this._virtualLoadedRecords[viewIndex].length != virtualRowCount){
						var	data = currentData.slice(startIndex, endIndex);						
						if(data.length + this._virtualLoadedRecords[viewIndex].length <= virtualRowCount){
							var viewData = $.merge(data, this._virtualLoadedRecords[viewIndex]); 
							this._virtualLoadedRecords[viewIndex] = viewData;
						}
					}
					else if(!this._virtualLoadedRecords[viewIndex] && viewIndex <= this._totalVirtualViews)
						this._virtualLoadedRecords[viewIndex] = currentData.slice(startIndex, endIndex);					
                }
            }
			if($.inArray(currentPage, this._virtualLoadedPages) == -1)
				this._virtualLoadedPages.push(currentPage);
        },
        _setVirtualLoadedIndexes: function(currentIndex){
			this._currentLoadedIndexes = [];            
            var virtualCount = currentIndex == this._totalVirtualViews ? currentIndex : currentIndex + 1;			
            if(currentIndex != 1)                               
                currentIndex = currentIndex - 1;            
            for (var i = currentIndex; i <= virtualCount; i++) {
                this._currentLoadedIndexes.push(i);                    
            }  
        },
        _getVirtualTotalRecord: function(){
            var recordCount = this.model.filterSettings.filteredColumns.length == 0 ? this._searchCount == null ? this._gridRecordsCount : this._searchCount : this._filteredRecordsCount;    
            return recordCount;
        },
        _initGridRender: function () {
            this.addInitTemplate();
            if (this.model.scrollSettings.frozenColumns > 0)
                this.addFrozenTemplate();
            this.model.allowGrouping && this.addGroupingTemplate();
            this.model.showSummary && this.addSummaryTemplate();
            if (this.model.allowResizing || this.model.allowResizeToFit)
                this._resizer = new ej.gridFeatures.gridResize(this);
            if (this.model.keySettings)
                $.extend(this.model.keyConfigs, this.model.keySettings);
           
            this.render();
            this._setTextWrap();
            if (this.model.columnLayout == "fixed") {
                var headerTableWidth = this.model.scrollSettings.frozenColumns > 0 ? this.getHeaderTable().eq(0).width() + this.getHeaderTable().eq(1).width() : this.getHeaderTable().width();
                var operation = this.getHeaderContent().width() > headerTableWidth ? 'addClass' : 'removeClass';
                var headerTable = this.getHeaderTable();
                var contentTable = this.getContentTable();
                if (this.model.scrollSettings.frozenColumns > 0) {
                    headerTable = this.getVisibleColumnNames().length <= this.model.scrollSettings.frozenColumns ? this.getHeaderTable().eq(1) : this.getHeaderTable().eq(0);
                    contentTable = this.getVisibleColumnNames().length <= this.model.scrollSettings.frozenColumns ? this.getContentTable().eq(1) : this.getContentTable().eq(0);
                }
                headerTable[operation]('e-tableLastCell');
                contentTable[operation]('e-tableLastCell');
            }
            if (this.model.allowGrouping && ej.gridFeatures.dragAndDrop)
                this._headerCellgDragDrop();
            if (this.model.allowReordering && ej.gridFeatures.dragAndDrop) {
                this._headerCellreorderDragDrop();
                this._initIndicators();
            }
            this._wireEvents();
            if (this.model.allowGrouping && !ej.isNullOrUndefined(this.model.serverProperties)) {
                this.model._groupingCollapsed = this.model.serverProperties._groupingCollapsed;
                for (var i = 0; i < this.model._groupingCollapsed.length; i++) {
                    var content = this.getContent().find(".e-recordplusexpand");
                    var tr = content.filter("td[ej-mappingname='" + this.model._groupingCollapsed[i].key + "'    ][ej-mappingvalue='" + this.model._groupingCollapsed[i].value + "']");
                    if (tr.length > 1 && !ej.isNullOrUndefined(this.model._groupingCollapsed[i].parent)) {
                        var parent = this.model._groupingCollapsed[i].parent;
                        tr = tr.filter(function (e) { return $(this).parents(".e-tabletd").parent("tr").prev("tr").find(".e-recordplusexpand[ej-mappingvalue=" + parent + "]").length })
                    }

                    this.expandCollapse(tr);
                }
            }
            this.initialRender = false;
            if (this.model.width && !this.model.allowScrolling)
                this.element.width(this.model.width);
            if (this.model.editSettings.allowEditing || this.model.editSettings.allowAdding)
                this._processEditing();
            this._trigger("dataBound", {});
			this._trigger("refresh");
            if (this.model.parentDetails) {  //refreshes parent scroller on child expand
                var id = this.model.parentDetails.parentID, parentObj = $("#" + id).data("ejGrid");
                parentObj.model.allowScrolling && parentObj._refreshScroller({ requestType: "refresh" });
            }
            if (this.element.closest('tr').hasClass('e-detailrow') && !this.model.parentDetails) {
                var parentObj = this.element.closest('tr.e-detailrow').closest('.e-grid').data("ejGrid");
                parentObj.model.allowScrolling && parentObj.getScrollObject().refresh();
            }
            if (this.model.allowFiltering && (this.model.filterSettings.filterType == "menu" || this.model.filterSettings.filterType == "excel")) {
                this._renderFilterDialogs();
            }
            if (this.model.enableResponsiveRow && (this.model.allowSorting || this.model.allowFiltering)) {
                this._renderResponsiveFilter();
            }
            if (this.model.allowGrouping && this.model.showSummary)
                this._refreshGroupSummary();
        },
        _setTextWrap: function () {
            if (this.model.allowTextWrap == true) {
                switch (this.model.textWrapSettings.wrapMode) {
                    case "content":
                        this.element.find(".e-columnheader").removeClass("e-wrap");
                        this.element.removeClass("e-wrap");
                        this.getContent().addClass("e-wrap");
                        break;
                    case "header":
                        this.element.removeClass("e-wrap");
                        this.getContent().removeClass("e-wrap");
                        this.element.find(".e-columnheader").addClass("e-wrap");
                        break;
                    default:
                        this.getContent().removeClass("e-wrap");
                        this.element.find(".e-columnheader").removeClass("e-wrap");
                        this.element.addClass("e-wrap");
                        break;
                }
            }
            else {
                this.getContent().removeClass("e-wrap");
                this.element.find(".e-columnheader").removeClass("e-wrap");
                this.element.removeClass("e-wrap");
            }
        },
        _getMetaColGroup: function () {
            var $colgroup = ej.buildTag("colgroup");
            for (var i = 0; i < this.model.columns.length; i++) {
                var $col = $(document.createElement("col"));
                this.model.columns[i]["visible"] === false && $col.css("display", "none");
				if(this.model.rowTemplate!=null && !ej.isNullOrUndefined(this.model.columns[i]["cssClass"]))
					$col.addClass(this.model.columns[i]["cssClass"]);
                if ( this.model.allowGrouping && !this.model.groupSettings.showGroupedColumn && $.inArray(this.model.columns[i]["field"], this.model.groupSettings.groupedColumns) != -1)
                    $col.css("display", "none");
                $colgroup.append($col);
            }
            return $colgroup;
        },
        _alternateRow: function () {
            return this.getIndex() % 2 == 0 ? "e-row" : "e-alt_row";
        },
        addInitTemplate: function () {
            var headerCellDiv = this.element.find(".e-headercelldiv:not(.e-emptyCell)"), templates = {}, firstVisible = true;
            var tbody = document.createElement('tbody'), $tbody = $(tbody);
            if (this.model.rowTemplate == null) {
                var tr = document.createElement('tr'),
                    $tr = $(tr),
                    columns = this.model.columns,
                    i;
                if (this._gridRecordsCount && !this._virtualDataRefresh)
                    this._initColumns(this.model.currentViewData[0] != undefined ? this.model.currentViewData[0] : this.model.currentViewData.value);
                else if (this._isLocalData && (this._dataSource() != null && this._dataSource().length || (this._dataManager && this._dataManager.dataSource.json.length)))
                    this._initColumns(this._dataSource()[0] != undefined ? this._dataSource()[0] : this._dataManager.dataSource.json[0]);
                var helpers = { _gridFormatting: this.formatting };
                $.views.helpers(helpers);

                var viewHelper = {};
                viewHelper["_foreignKey"] = this._foreignKeyBinding; 
                $.views.helpers(viewHelper);

                if (this.model.childGrid || this.model.detailsTemplate ) {
                    var $tdDetailCell = ej.buildTag("td.e-detailrowcollapse", "<div class='e-icon e-gnextforward'></div>");
                    $tr.append($tdDetailCell);
                }
                for (i = 0; i < this.model.columns.length; i++) {
                    var $tdCell = ej.buildTag("td.e-rowcell");
                    if (!ej.isNullOrUndefined(columns[i]["tooltip"]) || columns[i]["clipMode"] == ej.Grid.ClipMode.EllipsisWithTooltip)
                        $tdCell.addClass("e-gridtooltip")
                    if (columns[i]["clipMode"] == ej.Grid.ClipMode.Ellipsis || columns[i]["clipMode"] == ej.Grid.ClipMode.EllipsisWithTooltip)
                        $tdCell.addClass("e-gridellipsis");
                    if (this.model.isResponsive)
                        $tdCell.attr("data-cell", this._decode(this.model.columns[i]["headerText"]));
                    if (columns[i]["visible"] == false)
                        $tdCell.addClass("e-hide");
                    else {
                        if (firstVisible && (this.model.detailsTemplate != null || this.model.childGrid != null))
                            $tdCell.addClass('e-detailrowvisible');
                        firstVisible = false;
                    }
                    !this.model.groupSettings.showGroupedColumn && $tdCell.addClass("{{for ~groupedColumns}}" +
                        " {{if #data == '" + this.model.columns[i]["field"] + "'}}e-hide{{/if}}" +
                        "{{/for}}");
                    if (!ej.isNullOrUndefined(columns[i]["templateID"] || columns[i]["template"])) {
                        var viewHelper = {}, index, htxt = columns[i].headerText;
                        viewHelper["_" + this._id + "ColumnTemplating"] = ej.proxy(this._gridTemplate, null, this, index);
                        $.views.helpers(viewHelper);
                        if(!ej.isNullOrUndefined(htxt) && !ej.isNullOrUndefined(htxt.match(/[^0-9\s\w]/g)))
                            htxt = htxt.replace(/[^0-9\s\w]/g,"_");
                        $("#" + this._id + htxt + i + "_Template").remove();
                        var scriptElement = this._createTemplateElement(columns[i]);
                        if ((columns[i].field == "") || ej.isNullOrUndefined(columns[i].field))
                            this.model.columns[i]["allowGrouping"] = this.model.columns[i]["allowFiltering"] = this.model.columns[i]["allowSorting"] = false;
                        if (columns[i]["template"] != false)
                            $tdCell.addClass("e-templatecell").html("{{:~_" + this._id + "ColumnTemplating('" + scriptElement.id + "','" + i + "')}}");
                    } else {
                        var splits = (columns[i].field || "").split("."), sLen = splits.length - 1, braces = "";
                        while (sLen) {
                            braces += "(";
                            sLen--;
                        }
                        var columnType = columns[i].type || columns[i].editType
                        switch (columnType) {
                            case "boolean":
                            case "booleanedit":
                                if (ej.isNullOrUndefined(columns[i].displayAsCheckbox)) columns[i].displayAsCheckbox = true;
                                if (!columns[i]["displayAsCheckbox"])
                                    $tdCell.html('{{if ' + columns[i].field + '}}' + this.localizedLabels.True + '{{else}}' + this.localizedLabels.False + '{{/if}}');
                                else
                                    $tdCell.addClass("e-boolrowcell").html("{{if #data['" + splits.join("']['") + "']=='true'||#data['" + splits.join("']['") + "']==true}} <input type ='checkbox' disabled='disabled' checked='checked'></input>{{else}} <input type ='checkbox' disabled='disabled'></input> {{/if}}");
                                break;
                            default:
                                if (columns[i].disableHtmlEncode)
                                    $tdCell.html("{{html:" + braces + "#data['" + splits.join("'] || {})['") + "']}}");
                                else
                                    $tdCell.html("{{:" + braces + "#data['" + splits.join("'] || {})['") + "']}}");
                        }
                        if (columns[i]["format"] != undefined && (!columns[i]["foreignKeyValue"]))
                            $tdCell.html("{{:~_gridFormatting('" + columns[i]["format"] + "'," + braces + "#data['" + splits.join("'] || {})['") + "'],'" + this.model.locale + "')}}");
                        if (columns[i]["foreignKeyValue"] && columns[i]["dataSource"]) {
                            $tdCell.html("{{:~_foreignKey(" + i + "," + braces + "#data['" + splits.join("'] || {})['") + "'],'" + this._id + "')}}");
                        }
                        if (columns[i]["commands"]) {
                            var viewHelper = {};
                            viewHelper["_" + this._id + "UnboundTemplate"] = this._unboundTemplateRendering;
                            $.views.helpers(viewHelper);
                            if ((ej.isNullOrUndefined(columns[i]["field"])) || (columns[i].field == ""))
                                this.model.columns[i]["allowGrouping"] = this.model.columns[i]["allowFiltering"] = this.model.columns[i]["allowSorting"] = false;
                            if (!ej.isNullOrUndefined(columns[i].headerText))
                            $("#" + this._id + columns[i].headerText.replace(/[^a-z0-9|s_]/gi, '')+ "_UnboundTemplate").remove();
                            divElement = this._createUnboundElement(columns[i]);
                            if (!ej.isNullOrUndefined(columns[i].headerText))
                            $tdCell.addClass("e-unboundcell").addClass("e-" + columns[i]["headerText"].replace(/[^a-z0-9|s_]/gi, '')+i).html("{{:~_" + this._id + "UnboundTemplate('" + divElement.id + "')}}");
                            this.model.scrollSettings.frozenColumns > 0 && $tdCell.addClass("e-frozenunbound");
                            this._isUnboundColumn = true;
                        }

                    }
                    if (columns[i]["textAlign"] == undefined)
                        columns[i]["textAlign"] = "left";
                    if (columns[i]["isPrimaryKey"] === true) {
                        this._primaryKeys.push($.trim(columns[i].field));
                        this._primaryKeys = $.unique(this._primaryKeys);
                    }
                    if (!(this.phoneMode && this.model.enableResponsiveRow) && columns[i]["textAlign"] != undefined) {
                        $tdCell.css("text-align", columns[i]["textAlign"]);
                        $(headerCellDiv[i]).css("text-align", columns[i]["textAlign"]);
                    }
                    if (!this.phoneMode && !ej.isNullOrUndefined(columns[i]["headerTextAlign"])) {
                        $(headerCellDiv[i]).css("text-align", columns[i]["headerTextAlign"]);
                    }
                    if (!ej.isNullOrUndefined(columns[i]["cssClass"])) {
                        $tdCell.addClass(columns[i]["cssClass"]);
                    }
                    if (!ej.isNullOrUndefined(columns[i]["priority"]))
                        $tdCell.addClass("e-table-priority-" + columns[i]["priority"]);
                    if (!ej.isNullOrUndefined(columns[i]["customAttributes"]))
                        $tdCell.attr(columns[i]["customAttributes"]);
                    $tdCell.attr("role", "gridcell");
                    $tr.append($tdCell);
                    if (this.model.enableAltRow) {
                        helpers["_" + this._id + "AlternateRow"] = this._alternateRow;
                        $.views.helpers(helpers);
                        $tr.addClass("{{:~_" + this._id + "AlternateRow()}}");
                    }
                    else
                        $tr.addClass("e-row");
                    $tr.attr("role", "row");
                    if (this.model.scrollSettings.frozenColumns > 0 && this.model.scrollSettings.frozenColumns == i + 1) {
                        tbody.appendChild(tr);
                        templates[this._id + "_JSONFrozenTemplate"] = $tbody.html();
                        $tr.empty();
                        $tbody.empty();
                    }
                }
                tbody.appendChild(tr);
            }
            templates[this._id + "_JSONTemplate"] = this.model.rowTemplate != null ? $(this.model.rowTemplate).html() : $tbody.html();
            $.templates(templates);
        },
        
        
        render: function () {
            this.model.showSummary = this.model.summaryRows.length > 0 || this.model.showSummary;
            this._renderGridContent().insertAfter(this.element.children(".e-gridheader"));
            this.model.allowResizeToFit && this.setWidthToColumns();
            if (this.model.allowGrouping && ej.gridFeatures.dragAndDrop)
                this._groupHeaderCelldrag();
            if (this.model.showSummary && this._currentJsonData.length) {
                this._renderGridFooter().insertAfter(this.getContent());
                this._hideCaptionSummaryColumn();
            }
            this._initialEndRendering();

        },
        _createStackedRow: function (stackedHeaderRow, frozenHeader) {
            var $tr = ej.buildTag('tr.e-columnheader e-stackedHeaderRow');
            var sHeader = [], sCss = []; tAl = [], tp = [];
            for (var c = 0; c < this.model.columns.length; c++) {
                var column = this.model.columns[c];
                if (column.visible != false) {
                    if (this.model.allowGrouping && !this.model.groupSettings.showGroupedColumn && this.model.groupSettings.groupedColumns.length > 0) {
                        if ($.inArray(column.field, this.model.groupSettings.groupedColumns) != -1)
                            continue;
                    }
                    var headerText = '', cssClass = '', txtAlign = '', ttp = "";
                    var sColumn = stackedHeaderRow.stackedHeaderColumns;
                    for (var col = 0; col < sColumn.length; col++) {
                        var _column = $.isArray(sColumn[col].column) ? sColumn[col].column : $.map(sColumn[col].column.split(","), $.trim),
                            className = "e-row" + $.inArray(stackedHeaderRow, this.model.stackedHeaderRows) + "-column" + col;
                        if ($.inArray(column.field, _column) != -1)
                        {
                            headerText = sColumn[col].headerText;
                            cssClass = sColumn[col]["cssClass"];
                            txtAlign = sColumn[col].textAlign;
                            ttp = sColumn[col]["tooltip"] ? " e-gridtooltip " + className : '';
                        }                        
                    }
                    sHeader.push(headerText);
                    sCss.push(cssClass);
                    tAl.push(txtAlign);
                    tp.push(ttp);
                }
            }
            var colsPanList = []
            for (var i = 0; i < sHeader.length; i++) {
                var colSpan = 1;
                for (var j = i + 1; j < sHeader.length; j++) {
                    if (sHeader[i] == sHeader[j]) {
                        colSpan++;
                    }
                    else
                        break;
                }
                colsPanList.push({ sapnCount: colSpan, headerText: sHeader[i], cssClass: sCss[i], txtAlign: tAl[i], tooltip: tp[i] });
                i += colSpan - 1;
            }
            var $tr = ej.buildTag('tr.e-columnheader e-stackedHeaderRow');
            var frzCol = this.model.scrollSettings.frozenColumns;
            if (this.model.allowScrolling && frzCol > 0) {
                var frozenColspanList = [];
                var forzenColumn = 0, index = 0, frzHideCol = 0;
                for (var i = 0; i < this.model.columns.length; i++) {
                    var col = this.model.columns[i];
                    if (i < frzCol && col.visible == false)
                        frzHideCol++;
                }
                forzenColumn = frzCol - frzHideCol;
                while (forzenColumn > 0) {
                    var spanC = colsPanList[index].sapnCount;
                    if (colsPanList[index].sapnCount < forzenColumn) {
                        frozenColspanList.push(colsPanList[index])
                        if (!frozenHeader)
                            colsPanList.splice(index, 1);
                        else
                            index++;
                    }
                    else if (colsPanList[index].sapnCount > forzenColumn) {
                        colsPanList[index].sapnCount = colsPanList[index].sapnCount - forzenColumn
                        if (frozenHeader)
                            frozenColspanList.push({ sapnCount: forzenColumn, headerText: colsPanList[index].headerText });
                    }
                    else {
                        frozenColspanList.push(colsPanList[index])
                        if (!frozenHeader)
                            colsPanList.splice(index, 1);
                    }
                    forzenColumn -= spanC;
                }
                if (frozenHeader)
                    colsPanList = frozenColspanList
            }
            if (this.model.detailsTemplate || this.model.childGrid)
                $tr.append(ej.buildTag('th.e-headercell e-detailheadercell', '<div></div>'));
            for (var c = 0; c < colsPanList.length; c++) {
                var $th = ej.buildTag('th.e-headercell e-stackedHeaderCell e-default' + colsPanList[c].tooltip, colsPanList[c].headerText, {}, { 'colspan': colsPanList[c].sapnCount });
                $th.css("textAlign", colsPanList[c].txtAlign);
                $tr.append($th);
                if (colsPanList[c]["cssClass"] != undefined)
                    $th.addClass(colsPanList[c]["cssClass"]);
            }
            return $tr;
        },
        _renderGridHeaderInternalDesign: function (columns, frozenHeader) {
            var $table = ej.buildTag('table.e-table', "", {}, { cellspacing: "0.25px", role: "grid" });
            var $thead = ej.buildTag('thead');
            var $tbody = ej.buildTag('tbody.e-hide');
            var $columnHeader = ej.buildTag('tr.e-columnheader');
            var $colGroup = $(document.createElement('colgroup'));
            var $rowBody = $(document.createElement('tr'));
            if (this.model.childGrid || this.model.detailsTemplate ) {
                $columnHeader.append(ej.buildTag('th.e-headercell e-detailheadercell', '<div></div>'));
                $colGroup.append(this._getIndentCol());
            }
            if (this.model.showStackedHeader) {
                for (var index = 0; index < this.model.stackedHeaderRows.length; index++) {
                    var $tr = this._createStackedRow(this.model.stackedHeaderRows[index], frozenHeader);
                    $thead.append($tr);
                }
            }
            for (var columnCount = 0; columnCount < columns.length; columnCount++) {
                var $headerCell = ej.buildTag('th.e-headercell e-default', "", {}, { role: "columnheader" });
                var bodyCell = document.createElement('td');
                var $headerCellDiv = ej.buildTag('div.e-headercelldiv', columns[columnCount]["headerText"] === undefined ? columns[columnCount]["headerText"] = columns[columnCount]["field"] : columns[columnCount]["headerText"], {}, { "ej-mappingname": columns[columnCount]["field"] });
                if (columns[columnCount].disableHtmlEncode)
                    $headerCellDiv.text(columns[columnCount]["headerText"]);
                if (!ej.isNullOrUndefined(columns[columnCount]["headerTooltip"]))
                    $headerCellDiv.addClass("e-headertooltip");
                if (!ej.isNullOrUndefined(columns[columnCount]["tooltip"]))
                    $headerCellDiv.addClass("e-gridtooltip");
                if (columns[columnCount]["clipMode"] == ej.Grid.ClipMode.Ellipsis || columns[columnCount]["clipMode"] == ej.Grid.ClipMode.EllipsisWithTooltip)
                    $headerCellDiv.addClass("e-gridellipsis");
                $headerCell.append($headerCellDiv);
                if (this.model.allowFiltering && (this.model.filterSettings.filterType == "menu" || this.model.filterSettings.filterType == "excel") &&
                                (columns[columnCount]["allowFiltering"] == undefined || columns[columnCount]["allowFiltering"] === true) && (!ej.isNullOrUndefined(columns[columnCount].field) || columns[columnCount].field == "")) {
                        var filtericon = 'e-filterset';
                    if (!this.initialRender && this.model.filterSettings.filteredColumns) {
                        for (var i = 0; i < this.model.filterSettings.filteredColumns.length; i++) {
                            if (this.model.filterSettings.filteredColumns[i].field == columns[columnCount].field) {
                                filtericon = 'e-filterset e-filteredicon e-filternone';
                            }
                        }
                    }
                    $headerCell.append(ej.buildTag('div.e-filtericon e-icon ' + filtericon));
                    $headerCell.addClass("e-headercellfilter");
                    if (ej.browserInfo().name == "msie" && ej.browserInfo().version == "8.0" && this.model.enableRTL)
                        $($headerCellDiv).css("padding", "0 0 0 2em");
                }
                var col = document.createElement('col');
                if (columns[columnCount]["priority"])
                    $(bodyCell).addClass("e-table-priority-" + columns[columnCount]["priority"]);
                $rowBody.append(bodyCell);
                $columnHeader.append($headerCell);
                $colGroup.append(col);
                if (columns[columnCount]["visible"] === false) {
                    $headerCell.addClass("e-hide") && $(col).css("display", "none")
                    if ($.inArray(columns[columnCount].headerText, this._hiddenColumns) == -1 && $.inArray(columns[columnCount].field, this._hiddenColumnsField) == -1)
                        this._hiddenColumns.push(columns[columnCount].headerText) && columns[columnCount].field != ("" || undefined) ? this._hiddenColumnsField.push(columns[columnCount].field) : this._hiddenColumnsField.push(columns[columnCount].headerText);
                    if ($.inArray(columns[columnCount].field, this._visibleColumnsField) != -1)
                        this._visibleColumnsField.splice($.inArray(columns[columnCount].field, this._visibleColumnsField), 1) && this._visibleColumns.splice($.inArray(columns[columnCount].headerText, this._visibleColumns), 1)
                }
                else {
                    this._visibleColumns.push(columns[columnCount].headerText) && columns[columnCount].field != ("" || undefined) ? this._visibleColumnsField.push(columns[columnCount].field) : this._visibleColumnsField.push(columns[columnCount].headerText);
                    columns[columnCount]["visible"] = true;
                    if ($.inArray(columns[columnCount].field == "" ? columns[columnCount].headerText : columns[columnCount].field, this._hiddenColumnsField) != -1)
                        this._hiddenColumnsField.splice($.inArray(columns[columnCount].field == "" ? columns[columnCount].headerText : columns[columnCount].field, this._hiddenColumnsField), 1) && this._hiddenColumns.splice($.inArray(columns[columnCount].headerText, this._hiddenColumns), 1)
                }
                if (this.model.showColumnChooser && columns[columnCount]["showInColumnChooser"] !== false)
                    columns[columnCount]["showInColumnChooser"] = true;
                if (this.model.allowResizing && columns[columnCount]["allowResizing"] !== false)
                    columns[columnCount]["allowResizing"] = true;
                if (!ej.isNullOrUndefined(columns[columnCount]["headerTextAlign"]))
                    $headerCellDiv.css("text-align", columns[columnCount]["headerTextAlign"]);
                else if (columns[columnCount]["textAlign"] != undefined)
                    $headerCellDiv.css("text-align", columns[columnCount]["textAlign"]);
				else if (this.model.enableRTL)
					$headerCellDiv.css("text-align",columns[columnCount]["textAlign"] = "right");
                columns[columnCount]["allowResizing"] === false && this._disabledResizingColumns.push(columns[columnCount].field);
                columns[columnCount]["allowSorting"] === false && this._disabledSortableColumns.push(columns[columnCount].field);
                columns[columnCount]["allowGrouping"] === false && this._disabledGroupableColumns.push(columns[columnCount].field);
                columns[columnCount]["allowEditing"] === false && this._disabledEditableColumns.push(columns[columnCount].field);
                if (!ej.isNullOrUndefined(columns[columnCount]["cssClass"])) {
                    $headerCell.addClass(columns[columnCount]["cssClass"]);
                    $(col).addClass(columns[columnCount]["cssClass"]);
                }
                if (!ej.isNullOrUndefined(columns[columnCount]["headerTemplateID"])) {
                    $headerCellDiv.html($(columns[columnCount]["headerTemplateID"]).hide().html()).parent().addClass("e-headertemplate");
                    var index = $.inArray(columns[columnCount].field, this._disabledGroupableColumns);
                    index == -1 && ej.isNullOrUndefined(columns[columnCount].field) && this._disabledGroupableColumns.push(columns[columnCount].field);
                }
                if (this.model.allowGrouping && this.model.groupSettings.showToggleButton && $.inArray(columns[columnCount].field, this._disabledGroupableColumns) == -1 && !ej.isNullOrUndefined(columns[columnCount].field) && columns[columnCount].field != "") {
                    if ($.inArray(columns[columnCount].field, this.model.groupSettings.groupedColumns) != -1)
                        $headerCellDiv.append(this._getToggleButton().addClass("e-toggleungroup"));
                    else
                        $headerCellDiv.append(this._getToggleButton().addClass("e-togglegroup"));
                }
                if (this.model.isResponsive)
                    $headerCell.attr("title", this._decode(columns[columnCount].headerText));
                if (columns[columnCount]["priority"]) {
                    $headerCell.attr("data-priority", columns[columnCount]["priority"]).addClass("e-table-priority-" + columns[columnCount]["priority"]);
                    $(col).addClass("e-table-priority-" + columns[columnCount]["priority"]);
                }
                if (this.initialRender) {
                    if (typeof (columns[columnCount].width) == "string" && columns[columnCount].width.indexOf("%") != -1)
                        this.columnsWidthCollection.push(parseInt(columns[columnCount]["width"]) / 100 * this.element.width());
                    else
                        this.columnsWidthCollection.push(columns[columnCount]["width"]);
                }
                if (columns[columnCount]["width"] == undefined && this.model.commonWidth !== undefined)
                    this.columnsWidthCollection[columnCount] = this.model.commonWidth;
                this._fieldColumnNames[columns[columnCount].headerText] = columns[columnCount].field;
                this._headerColumnNames[columns[columnCount].field] = columns[columnCount].headerText;                
            }
            $thead.append($columnHeader);
            $tbody.append($rowBody);
            $table.append($colGroup).append($thead).append($tbody);
            return $table;
        },
        _renderGridHeader: function () {
            var $div = ej.buildTag('div.e-gridheader'), temp, $frozenDiv, $movableDiv;
            var $innerDiv = ej.buildTag('div');
            if (this.model.allowScrolling)
                $innerDiv.addClass("e-headercontent");
            this.setGridHeaderContent($div);
            if (this.initialRender) {
                this.columnsWidthCollection = [];
                this._hiddenColumns = [];
                this._hiddenColumnsField = [];
            }
            this._visibleColumns = [];
            this._visibleColumnsField = [];
            this._disabledGroupableColumns = [];
            this._fieldColumnNames = {};
            this._headerColumnNames = {};
            if (this.model.scrollSettings.frozenColumns > 0) {
                $frozenDiv = ej.buildTag("div.e-frozenheaderdiv", this._renderGridHeaderInternalDesign(this.model.columns.slice(0, this.model.scrollSettings.frozenColumns), true));
                $movableDiv = ej.buildTag("div.e-movableheader", ej.buildTag("div.e-movableheaderdiv", this._renderGridHeaderInternalDesign(this.model.columns.slice(this.model.scrollSettings.frozenColumns), false)));
                $innerDiv.append($frozenDiv).append($movableDiv);
            } else
                $innerDiv.append(this._renderGridHeaderInternalDesign(this.model.columns));
            $div.html($innerDiv);
            if (this.model.isResponsive)
                $div.addClass("e-textover");
            this.setGridHeaderTable(this.getHeaderContent().find(".e-table"));
            return $div;
        },
        _renderGridContent: function () {
            var $div = ej.buildTag('div.e-gridcontent');
            var $innderDiv = ej.buildTag('div');
            var $table = ej.buildTag('table.e-table', "", {}, { cellspacing: "0.25px" });
            var $tbody = $(document.createElement('tbody'));
            $table.append(this.getHeaderTable().find('colgroup').clone()).append($tbody);
            $innderDiv.html($table);
            $div.html($innderDiv);
            this.setGridContentTable($table);
            this.setGridContent($div);
            $table.attr("role", "grid");
            var args = {};
            if (this.model.allowGrouping && this.model.groupSettings.groupedColumns.length) {
                if (this.initialRender) {
                    args.columnName = this.model.groupSettings.groupedColumns[this.model.groupSettings.groupedColumns.length - 1];
                    if (!this.model.groupSettings.showGroupedColumn) {
                        for (var i = 0; i < this.model.groupSettings.groupedColumns.length; i++) {
                            var col = this.model.groupSettings.groupedColumns[i];
                            if ($.inArray(col, this._hiddenColumnsField) == -1) {//updated for
                                this._hiddenColumnsField.push(col);//updated for
                                this.getColumnByField(col).visible = false;
                            }
                        }
                    }
                }
                args.requestType = ej.Grid.Actions.Grouping;
            } else
                args.requestType = ej.Grid.Actions.Refresh;
            if (this._dataSource() == null || this._dataSource().length == 0 || this.model.currentViewData.length == 0) {
                var $emptyTd = ej.buildTag('td.emptyrecord', this.localizedLabels.EmptyRecord, {}, { colSpan: this.model.columns.length });
                $tbody.append($(document.createElement("tr")).append($emptyTd));
                this.setWidthToColumns();
                if (this.initialRender || this.model.groupSettings.groupedColumns.length)
                    this.sendDataRenderingRequest(args)
            } else
                this.sendDataRenderingRequest(args);
            if (this._isCaptionSummary && args.requestType == "grouping" && this.model.groupSettings.groupedColumns.length > 1) {
                var colgroup = this.getContentTable().find(".e-table").not(".e-recordtable").children("colgroup");
                var $cols1 = $(this.getContentTable().find(".e-recordtable")[0]).children("colgroup").find("col");
                for (i = 0; i < colgroup.length; i++) {
                    var colCount = $(colgroup[i]).find("col").length;
                    $(colgroup[i]).find("col:gt(" + (colCount - $cols1.length - 1) + ")").remove();
                    $(colgroup[i]).append($cols1.clone());
                }
            }
            return $div;
        },
        
        print: function () {
            var args = {}; args.requestType = "print";
            this._printselectrows = this.getContentTable().find('tr[aria-selected="true"]');
            
            this._trigger("actionBegin", args);
            var allowPaging = this.model.allowPaging;
			if(this._$fDlgIsOpen){
                 this.element.find('.e-excelfilter:visible').css("display","none");
                 this.element.find('.e-filterdialoglarge:visible').css("display","none");
            }
            var elementClone = this.element.clone();
			var printWin = window.open('', 'print', "height=452,width=1024,tabbar=no");
            if (this.model.allowPaging && this.model.pageSettings.printMode == "currentpage") {
                this.getPager().css('display', 'none');
                elementClone = this.element.clone();
                if (!this.model.allowScrolling) {
                    this.refreshContent();
                    this.getPager().css('display', 'block');
                }
            }
            else if (allowPaging) {
                this.model.allowPaging = false;
                this.refreshContent();
                this.getPager().css('display', 'none');
                elementClone = this.element.clone();
                this.model.allowPaging = true;
                if (!this.model.allowScrolling) {
                    this.refreshContent();
                    this.getPager().css('display', 'block');
                }
            }
            if (this.model.allowScrolling) {
                var scrollWidth = this.model.scrollSettings.width, scrollHeight = this.model.scrollSettings.height;
				if (this.getScrollObject().isVScroll() || this.getScrollObject().isHScroll()) {
					var scrollContent = this.getContent().find('.e-content')[0];
					elementClone.find('.e-gridcontent').height(scrollContent.scrollHeight);
					elementClone.find('.e-gridcontent').ejScroller({ width: scrollContent.scrollWidth, height: scrollContent.scrollHeight });
					elementClone.width(scrollContent.scrollWidth);
				}
                if (this.model.allowPaging) {
                    this.refreshContent();
                    this.getPager().css('display', 'block');
                }
            }
            if (this.model.toolbarSettings.showToolbar)
                elementClone.find(".e-gridtoolbar").remove();
            if (this.model.allowFiltering && this.model.filterSettings.filterType == "filterbar")
                elementClone.find(".e-filterbar").remove();
            args = { requestType: "print", element: elementClone, selectedRows: this._printselectrows };
            this._trigger("beforePrint", args);
            if (!ej.isNullOrUndefined(args.element))
                elementClone = args.element;
            ej.print(elementClone, printWin);
            args.requestType = "print";
            this._trigger("actionComplete", args);
        },
        
         "export": function (action, serverEvent, multipleExport,gridIds) {
           var modelClone = $.extend(true, {}, this.model);
            var proxy = this;
            var attr = { action: action, method: 'post', "data-ajax": "false" };
            var form = ej.buildTag('form', "", null, attr);
            if (multipleExport && !ej.isOnWebForms) {
                var gridCol=$('div.e-grid');
                if (gridIds && gridIds.length > 0) {
                    gridCol = $.map(gridIds, function (i) { return document.getElementById(i) })
                }
                $.each(gridCol,function (index, object) {
                        var gridobjectArray = {};
                        var gridObject = $(object).data('ejGrid');
                        if (!ej.isNullOrUndefined(gridObject)) {
                            var modelClone = $.extend(true, {}, gridObject.model);
                            modelClone = proxy._getModifyExportModel(modelClone);
                            if (gridObject.ignoreOnExport) {
                                for (var i = 0; i < gridObject.ignoreOnExport.length; i++) {
                                    delete modelClone[gridObject.ignoreOnExport[i]];
                                }
                                var inputAttr = { name: 'GridModel', type: 'hidden', value: gridObject.stringify(modelClone) }
                                var input = ej.buildTag('input', "", null, inputAttr);
                                form.append(input);
                            }
                        }
                    });
                    $('body').append(form);
                    form.submit();
            }
            else{
                this._locale = this.model.locale;
                modelClone = this._getModifyExportModel(modelClone);
                var gridob = this;
                if (this.ignoreOnExport) {
                    for (var i = 0; i < this.ignoreOnExport.length; i++) {
                        delete modelClone[this.ignoreOnExport[i]];
                    }
                }
                if (ej.raiseWebFormsServerEvents) {
                    var args = { model: modelClone, originalEventType: serverEvent };
                    var clientArgs = { model: this.stringify(modelClone) };
                    ej.raiseWebFormsServerEvents(serverEvent, args, clientArgs);
                    setTimeout(function () {
                        ej.isOnWebForms = true;
                    }, 1000);
                }
                else {
                        var inputAttr = { name: 'GridModel', type: 'hidden', value: this.stringify(modelClone) }
                        var input = ej.buildTag('input', "", null, inputAttr);
                        form.append(input);
                        form.append(this);
                        $('body').append(form);
                        form.submit();
                }
                setTimeout(function () {
                    proxy.model.locale = proxy._locale;
                }, 0);
            }
            return true;
        },
        _getModifyExportModel:function(modelClone){
            var tempObj = {}
            $.extend(tempObj, ej.Grid.Locale["en-US"], ej.Grid.Locale[modelClone.locale]);
            var temp = tempObj.GroupCaptionFormat;
            var split1 = temp.indexOf("{{if");
            var split2 = temp.indexOf(" {{else}}");
            var grpText = temp.slice(split1, split2).replace("{{if count == 1 }}", "");
            var localeProp = { EmptyRecord: tempObj.EmptyRecord, GroupCaptionFormat: temp.slice(0, split1), GroupText: grpText,True:tempObj.True,False:tempObj.False };
            if (!ej.isNullOrUndefined(this.model))
                this.model.locale = modelClone.locale.concat(JSON.stringify(localeProp));
            modelClone.locale = modelClone.locale.concat(JSON.stringify(localeProp));
            for (var i = 0; i < modelClone.columns.length; i++) {
                if (modelClone.columns[i].editType != undefined) {
                    switch (modelClone.columns[i].editType) {
                        case "stringedit":
                        case "edittemplate":
                            modelClone.columns[i].editType = "string";
                            break;
                        case "numericedit":
                            modelClone.columns[i].editType = "numeric";
                            break;
                        case "dropdownedit":
                            modelClone.columns[i].editType = "dropdown";
                            break;
                        case "booleanedit":
                            modelClone.columns[i].editType = "boolean";
                            break;
                        default:
                            break;
                    }
                }
            }
            for (var i = 0; i < modelClone.filterSettings.filteredColumns.length; i++) {
                if (modelClone.filterSettings.filteredColumns[i].operator == "equal")
                    modelClone.filterSettings.filteredColumns[i].operator = "equals";
                else if (modelClone.filterSettings.filteredColumns[i].operator == "notequal")
                    modelClone.filterSettings.filteredColumns[i].operator = "notequals";
            }
            if (modelClone.showStackedHeader) {
                modelClone.stackedHeaderRow = modelClone.stackedHeaderRows;
                for (var i = 0; i < modelClone.stackedHeaderRow.length; i++) {
                    modelClone.stackedHeaderRow[i].stackedHeaderColumn = modelClone.stackedHeaderRow[i].stackedHeaderColumns;
                    var a = modelClone.stackedHeaderRow[i].stackedHeaderColumn;
                    for (var j = 0; j < a.length; j++) {
                        modelClone.stackedHeaderRow[i].stackedHeaderColumn[j].column = $.isArray(a[j].column) ? a[j].column : a[j].column.split(',');
                    }
                }
            }
            return modelClone
        },
        sendDataRenderingRequest: function (args) {
            if (this._templateRefresh) {
                this.refreshTemplate();
                this._templateRefresh = false;
            }
            this.setFormat();
            if(!this.model.scrollSettings.enableVirtualization){
				this._previousColumnIndex = null;
				this._previousRowCellIndex = null;
				this._previousIndex = null;
			}
            if (args.requestType == "add" || args.requestType == "grouping" || args.requestType == "reorder" || (this.model.currentViewData != null && this.model.currentViewData.length)) {
                switch (args.requestType) {
                    case ej.Grid.Actions.Refresh:
                    case ej.Grid.Actions.Paging:
                    case ej.Grid.Actions.Sorting:
                    case ej.Grid.Actions.Filtering:
                    case ej.Grid.Actions.Save:
                    case ej.Grid.Actions.Cancel:
                    case ej.Grid.Actions.Delete:
                    case ej.Grid.Actions.Search:
                    case ej.Grid.Actions.Reorder:
                    case ej.Grid.Actions.BatchSave:
                        var cloneGroupedColumns = this.model.groupSettings.groupedColumns
                        if(this.model.allowGrouping && args.requestType == ej.Grid.Actions.Refresh && cloneGroupedColumns.length == 0 && this.element.find(".e-grouptopleftcell").length > 0) {
                            var $header = this.element.children(".e-gridheader");
                            $header.find("div").first().empty().append(this._renderGridHeader().find("table"));
                        }
                        if(!this.model.allowGrouping)
                            cloneGroupedColumns = [];
                        if (this.model.editSettings.editMode == "externalform" || this.model.editSettings.editMode == "externalformtemplate")
                            $("#" + this._id + "_externalEdit").css("display", "none");
                        if (cloneGroupedColumns.length == 0) {
                            var temp = document.createElement('div'), temp1, insertIndex = -1, isRemoteAdaptor = false;
                            if (!this.phoneMode)
                                this.getContentTable().find("colgroup").first().replaceWith(this._getMetaColGroup());
                            (this.model.childGrid != null || this.model.detailsTemplate != null) && this.getContentTable().find("colgroup").first().prepend(this._getIndentCol());
                            var currentPage = this._currentPage();
                            if ((this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate" || this.model.editSettings.editMode == "normal") && (args.requestType == "cancel" || args.requestType == "save"))
                                this._editFormHeight = this.element.find(".gridform").closest("tr").height();
     
                            if (this.model.scrollSettings.frozenColumns > 0)
                                temp.innerHTML = this._renderByFrozenDesign();
                            else {                                
                                if (args.data) {
                                    temp1 = document.createElement('div');
                                    temp1.innerHTML = ['<table>', $.render[this._id + "_JSONTemplate"](args.data), '</table>'].join("");
                                    if (this._dataSource() instanceof ej.DataManager && args.requestType == ej.Grid.Actions.Save) {
                                        insertIndex = this._getDataIndex(this.model.currentViewData, args.data);
                                        isRemoteAdaptor = this._dataSource().adaptor instanceof ej.remoteSaveAdaptor;
                                    }
                                }
                                temp.innerHTML = ['<table>', $.render[this._id + "_JSONTemplate"](this.model.currentViewData), '</table>'].join("");
                                var tableEle = this.getContentTable().get(0);
                                var tbodyEle = tableEle.lastChild;
                                var rindex = this.getContentTable().first().find('tbody').first();
                                if ((args.requestType == "save" || args.requestType == "cancel") && this.model.editSettings.editMode != "batch") {
                                    if (this.model.editSettings.editMode.indexOf("inlineform") != -1)
                                        rowIndex = !ej.isNullOrUndefined(args.selectedRow) ? args.selectedRow : this._selectedRow();
                                    else
                                        rowIndex = this.getContentTable().find('.e-' + args.action + 'edrow').index();
                                    var a = this._currentTrIndex;
                                    if (rowIndex == -1)
                                        rowIndex = a;
                                    if (this.model.detailsTemplate != null || this.model.childGrid != null) {
                                        if (this.model.editSettings.editMode == "inlineform")
                                            var rowTr = $($(tbodyEle.childNodes).not('.e-detailrow')[rowIndex]);
                                        else
                                            var rowTr = $(tbodyEle.childNodes[rowIndex]);
                                        var rowEle = $(tbodyEle.childNodes).not('.e-detailrow');
                                        for (var i = 0; i < rowEle.length; i++) {
                                            if (rowTr.is(rowEle[i]))
                                                rowIndex = i;
                                        }
                                    }

                                    if (this.model.editSettings.editMode == "normal" || this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate") {
                                        if (args.action == "add" && !this.getContentTable().find(".e-addedrow").length) break;
                                        $oldChild = this.getContentTable().find('.e-addedrow').get(0);
                                        $editedTr = this.getContentTable().find('.e-editedrow');
                                        $newChild = ($editedTr.length || args.requestType == "cancel") ? temp.firstChild.firstChild.firstChild : temp1.firstChild.firstChild.lastChild;                       
                                        if ($editedTr.length) {
                                            if (this.model.editSettings.showAddNewRow && this.model.editSettings.rowPosition == "top")
                                                rowIndex = rowIndex - 1;
                                            $newChild = temp.firstChild.firstChild.childNodes[rowIndex];
                                            if (this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate") {
                                                $oldChild = $editedTr.prev('tr').get(0);
                                                $editedTr.remove();
                                            } else
                                                $oldChild = $editedTr.get(0);
                                            var $newChildObj = $($newChild), $oldChildObj = $($oldChild);
                                            if ((this.model.detailsTemplate != null || this.model.childGrid != null) && $oldChildObj.next('tr.e-detailrow:visible').length) {
                                                var $target = $newChildObj.find('.e-detailrowcollapse');
                                                $target.removeClass("e-detailrowcollapse").addClass("e-detailrowexpand").find("div").removeClass("e-gnextforward").addClass("e-gdiagonalnext");
                                            }
                                            if (args.requestType == "cancel") {
                                                if (this.model.editSettings.showAddNewRow)
                                                    this.getContentTable().find('.e-addedrow').addClass("e-showaddrow");
                                                $oldChildObj.replaceWith($newChildObj);
                                            } else if (!ej.isNullOrUndefined(this._filteredRecordsCount) && this._filteredRecordsCount < this._previousFilterCount) {
                                                if (this.model.detailsTemplate != null && $oldChildObj.next('tr.e-detailrow').length)
                                                    tbodyEle.removeChild($oldChildObj.next('tr.e-detailrow').get(0));
                                                $oldChildObj.remove();
                                                if (this.model.allowPaging && this.model.pageSettings.pageSize <= this.model.currentViewData.length && cloneGroupedColumns.length == 0)
                                                    tbodyEle.appendChild(temp.firstChild.firstChild.lastChild);
                                            } else if (this.model.sortSettings.sortedColumns.length && args.requestType == "save" && this._currentJsonData.length > 0 || !ej.isNullOrUndefined(this._searchCount))
                                                this.getContentTable().get(0).replaceChild(this.model.rowTemplate != null ? temp.firstChild.lastChild : temp.firstChild.firstChild, this.getContentTable().get(0).lastChild);
                                            else {
                                                if (ej.isNullOrUndefined(this.model.currentViewData[rowIndex]) || this.model.currentViewData[rowIndex][this._primaryKeys[0]] != args.data[this._primaryKeys[0]])
                                                    $(tbodyEle).replaceWith($(temp).find('tbody'))
                                                else
                                                    tbodyEle.replaceChild($newChild, $oldChild);
                                            }
											if (this.model.editSettings.showAddNewRow)
												this.model.editSettings.rowPosition == "top" ? tbodyEle.firstChild.remove(): tbodyEle.lastChild.remove();
                                        } else {
                                            var $newChildObj = $($newChild), $oldChildObj = $($oldChild);
                                            if (args.action == "add" && args.requestType == "save" && this.model.editSettings.showAddNewRow && this.model.allowPaging && this.model.pageSettings.pageSize <= this._currentJsonData.length)
                                                this.model.editSettings.rowPosition == "bottom" ? tbodyEle.lastChild.previousSibling.remove() : tbodyEle.lastChild.remove();
                                            if (args.requestType == "cancel" || this._dataSource() instanceof ej.DataManager || this._currentPage() != 1 || (args.requestType == "save" && !ej.isNullOrUndefined(this._filteredRecordsCount) && this._filteredRecordsCount == this._previousFilterCount)) {
                                                if (!ej.isNullOrUndefined($oldChild)) {
                                                    $oldChildObj.remove();
                                                    if (this._dataSource() instanceof ej.DataManager && insertIndex != -1) {
                                                        if (insertIndex == 0)
                                                            tbodyEle.insertBefore($newChild, tbodyEle.children[insertIndex]);
                                                        else
                                                            $newChildObj.insertAfter(tbodyEle.children[insertIndex - 1]);
                                                    }
                                                    else if ((!(this._dataSource() instanceof ej.DataManager) || isRemoteAdaptor) && this._currentPage() != 1 && args.requestType == "save")
                                                        $(tbodyEle).prepend($(temp.firstChild.firstChild.firstChild));
                                                    if (this.model.allowPaging && this.model.pageSettings.pageSize <= this.model.currentViewData.length && cloneGroupedColumns.length == 0 &&
                                                        ((this._dataSource() instanceof ej.DataManager && insertIndex == -1 && (!isRemoteAdaptor && args.requestType != "save")) ||
                                                        (args.requestType != "save" && !(this._dataSource() instanceof ej.DataManager))) && (args.requestType == "cancel" && !this.model.editSettings.showAddNewRow))
                                                        tableEle.lastChild.appendChild(temp.firstChild.firstChild.lastChild);
                                                }
                                                if (args.requestType == "cancel" && this._selectedRow() != -1)
                                                    this.clearSelection();

                                            } else if (this.model.currentViewData.length == 1) {
                                                $(tbodyEle).empty();
                                                tbodyEle.appendChild($newChild);
                                            } else if (this.model.sortSettings.sortedColumns.length && args.requestType == "save" && this._currentJsonData.length > 0 || !ej.isNullOrUndefined(this._searchCount)) {
                                                this.getContentTable().get(0).replaceChild(this.model.rowTemplate != null ? temp.firstChild.lastChild : temp.firstChild.firstChild, this.getContentTable().get(0).lastChild);
                                            } else if (this.model.editSettings.rowPosition == "bottom") {
                                                rindex.prepend($oldChild);
                                                tbodyEle.replaceChild($newChild, $oldChild);
                                            } else
                                                tbodyEle.replaceChild($newChild, $oldChild);
                                        }
                                    } else if (this.model.editSettings.editMode == "dialog" || this.model.editSettings.editMode == "dialogtemplate" || this.model.editSettings.editMode == "externalform" || this.model.editSettings.editMode == "externalformtemplate") {
                                        $editedTr = this.element.find('.e-editedrow');
                                        if (args.requestType == "cancel" || (!$editedTr.length && !ej.isNullOrUndefined(this._filteredRecordsCount) && this._filteredRecordsCount == this._previousFilterCount)) {
                                            $newChild = temp.firstChild.firstChild.childNodes[rowIndex];
                                            $oldChild = tbodyEle.childNodes[rowIndex];
                                            var $newChildObj = $($newChild), $oldChildObj = $($oldChild);
                                            if ((this.model.detailsTemplate != null || this.model.childGrid != null) && $oldChildObj.next('.e-detailrow:visible').length) {
                                                var $target = $newChildObj.find('.e-detailrowcollapse');
                                                $target.removeClass("e-detailrowcollapse").addClass("e-detailrowexpand").find("div").removeClass("e-gnextforward").addClass("e-gdiagonalnext");
                                            }
                                            $oldChildObj.replaceWith($newChildObj);
                                            this.clearSelection();
                                            this.model.allowPaging && this._refreshGridPager();

                                        } else if ($editedTr.length) {
                                            $newChild = temp.firstChild.firstChild.childNodes[rowIndex];
                                            $oldChild = this._excludeDetailRows(tbodyEle.childNodes)[rowIndex];
                                            if (this.model.allowCellMerging != null) {
                                                var $oldChildObj = $($oldChild);
                                                if ($($oldChild.childNodes).hasClass("e-merged")) {
                                                    var index = $oldChildObj.children('.e-merged').index();
                                                    var count = $oldChild.children[index].colSpan;
                                                    for (var i = 0 ; i < count; i++) {
                                                        $newChild.childNodes[index + i].className += " e-merged e-hide";
                                                        $newChild.childNodes[index].colSpan = i + 1;
                                                    }
                                                }
                                            }
                                            if (this.model.detailsTemplate != null)
                                                $oldChild = $(tbodyEle.childNodes).not('.e-detailrow').eq(rowIndex).get(0);
                                            if ((this.model.detailsTemplate != null || this.model.childGrid != null) && $oldChildObj.next('tr.e-detailrow:visible').length) {
                                                var $target = $($newChild).find(".e-detailrowcollapse");
                                                $target.removeClass("e-detailrowcollapse").addClass("e-detailrowexpand").find("div").removeClass("e-gnextforward").addClass("e-gdiagonalnext");
                                            }
                                            if (!ej.isNullOrUndefined(this._filteredRecordsCount) && this._filteredRecordsCount < this._previousFilterCount) {
                                                var $oldChildObj = $($oldChild);
                                                if (this.model.detailsTemplate != null && $oldChildObj.next('tr.e-detailrow').length)
                                                    tbodyEle.removeChild($oldChildObj.next('tr.e-detailrow').get(0));
                                                $oldChildObj.remove();
                                                if (this.model.allowPaging && this.model.pageSettings.pageSize <= this.model.currentViewData.length)
                                                    tbodyEle.appendChild(temp.firstChild.firstChild.lastChild);
                                            } else if (this.model.sortSettings.sortedColumns.length && args.requestType == "save" && this._currentJsonData.length > 0 || !ej.isNullOrUndefined(this._searchCount))
                                                this.getContentTable().get(0).replaceChild(this.model.rowTemplate != null ? temp.firstChild.lastChild : temp.firstChild.firstChild, this.getContentTable().get(0).lastChild);
                                            else {
                                                if (ej.isNullOrUndefined(this.model.currentViewData[rowIndex]) || this.model.currentViewData[rowIndex][this._primaryKeys[0]] != args.data[this._primaryKeys[0]])
                                                    $(tbodyEle).replaceWith($(temp).find('tbody'))
                                                else
                                                    tbodyEle.replaceChild($newChild, $oldChild);
                                            }
                                        } else if (this.model.currentViewData.length == 1 && this.getContentTable().find('td.e-rowcell').length == 0) {
                                            $newChild = temp.firstChild.firstChild.firstChild;
                                            $(tbodyEle).empty();
                                            tbodyEle.appendChild($newChild);
                                        } else {
                                            newChild = ($editedTr.length || args.requestType == "cancel") ? temp.firstChild.firstChild.firstChild : temp1.firstChild.firstChild.lastChild;
                                            if (!(this._dataSource() instanceof ej.DataManager)) {
                                                if (this.model.sortSettings.sortedColumns.length && args.requestType == "save" && this._currentJsonData.length > 0 || !ej.isNullOrUndefined(this._searchCount))
                                                    this.getContentTable().get(0).replaceChild(this.model.rowTemplate != null ? temp.firstChild.lastChild : temp.firstChild.firstChild, this.getContentTable().get(0).lastChild);
                                                else if (this._currentPage() == 1)
                                                    this.getContentTable().find('tbody').first().prepend($(newChild));
                                                else
                                                    this.getContentTable().find('tbody').first().prepend($(temp.firstChild.firstChild.firstChild));
                                                if (this.model.allowPaging && this.model.pageSettings.pageSize <= this.model.currentViewData.length)
                                                    tbodyEle.removeChild(tbodyEle.lastChild);
                                            }
                                            else if (insertIndex != -1) {
                                                if (insertIndex == 0)
                                                    tbodyEle.insertBefore(newChild, tbodyEle.children[insertIndex]);
                                                else
                                                    $(newChild).insertAfter(tbodyEle.children[insertIndex - 1]);
                                                if (this.model.allowPaging && (this.model.pageSettings.pageSize <= this.model.currentViewData.length || insertIndex == this.model.pageSettings.pageSize - 1))
                                                    tbodyEle.removeChild(tbodyEle.lastChild);
                                            }
                                            if (this.model.detailsTemplate != null && $(tableEle.lastChild.lastChild).children('.e-detailrowexpand').length)
                                                tbodyEle.removeChild(tbodyEle.lastChild);
                                        }
                                    }
                                    if (this.model.editSettings.showAddNewRow)
                                        this._gridRows = this.getContentTable().first().find(".e-rowcell").closest("tr.e-row, tr.e-alt_row").toArray();
                                    else
                                        this._gridRows = tableEle.rows;
                                    if (this.model.enableAltRow)
                                        this._refreshAltRow();
                                } else if (args.requestType == "delete") {
                                    if (this._isUnboundColumn) {
                                        $editedrow = this.element.find('.e-editedrow');
                                        $oldChild = this.getContentTable().find('.e-editedrow').get(0);
                                        $newChild = ($editedrow.length) ? temp.firstChild.firstChild.firstChild : temp1.firstChild.firstChild.lastChild;

                                        if ($editedrow.length != 0 && (this.model.editSettings.editMode == "normal" || this.model.editSettings.editMode == "externalform" || this.model.editSettings.editMode == "externalformtemplate")) {
                                            $($oldChild).replaceWith($($newChild));
                                        }
                                        else if (this.model.editSettings.editMode == "inlineform" || this.model.editSettings.editMode == "inlineformtemplate") {
                                            $oldChild = $editedrow.prev('tr').get(0);
                                            $editedrow.remove();
                                        }
                                        else
                                            $oldChild = $editedrow.get(0);
                                    }
                                    if (this.model.allowPaging && this.model.pageSettings.pageSize <= this.model.currentViewData.length && this.getContentTable()[0].rows.length != this.model.currentViewData.length) {
                                        if (this.getContentTable().find("tr").length && this._excludeDetailRows().length) {
                                            if (this.multiDeleteMode) {
                                                var rowLength = temp.firstChild.firstChild.rows.length;
                                                var rows = $(temp.firstChild.firstChild.rows).slice(rowLength - this.selectedRowsIndexes.length, rowLength);
                                                $(tbodyEle).append(rows);
                                            }
                                            else
                                                tbodyEle.appendChild(temp.firstChild.firstChild.lastChild);

                                        }
                                        else
                                            $(tbodyEle).prepend(temp.firstChild.firstChild.rows);
                                    }
                                    if (this.model.detailsTemplate != null || this.model.childGrid != null) {
                                        var visibleRow = this.getContentTable().find('.e-detailrow:visible');
                                        $.each(visibleRow, function (indx, item) {
                                            if (visibleRow.eq(indx).closest('tr').prev().children('.e-detailrowexpand').length == 0)
                                                visibleRow.eq(indx).remove();
                                        });
                                    }
                                    this._gridRows = tableEle.rows;
                                    if (this.model.enableAltRow)
                                        this._refreshAltRow();
                                } else
                                    this.getContentTable().get(0).replaceChild(this.model.rowTemplate != null ? temp.firstChild.lastChild : temp.firstChild.firstChild, this.getContentTable().get(0).lastChild);

                            }
                            this._currentJsonData = this.model.currentViewData;
                            if (this.model.editSettings.showAddNewRow)
                                this._gridRows = this.getContentTable().first().find(".e-rowcell").closest("tr.e-row, tr.e-alt_row").toArray();
                            else
                                this._gridRows = this.getContentTable().get(0).rows;
                            if (this.model.scrollSettings.frozenColumns > 0)
                                this._gridRows = [this._gridRows, this.getContentTable().get(1).rows];

                            var model = {};
                            if ((args.requestType == "sorting" || args.requestType == "filtering") && this.model.scrollSettings.allowVirtualScrolling) {
                                if (args.requestType == "filtering") {
                                    this.getContent().first().ejScroller("refresh").ejScroller("isVScroll") ? this.element.find(".gridheader").addClass("e-scrollcss") : this.element.find(".gridheader").removeClass("e-scrollcss");
                                    var model = this._refreshVirtualPagerInfo();
                                }
                                if(this.model.scrollSettings.enableVirtualization)
									this._refreshVirtualView(this._currentVirtualIndex);
								else
									this._refreshVirtualContent(currentPage);
                                args.requestType == "filtering" && this.getContent().first().ejScroller("refresh");
                            }
                            if (this.model.allowPaging) {
                                if (this.model.filterSettings.filteredColumns.length)
                                    this.getPager().ejPager({ totalRecordsCount: this._searchCount == null ? this._filteredRecordsCount : this._searchCount, currentPage: this._currentPage() });
                                else
                                    this.getPager().ejPager({ totalRecordsCount: this._searchCount == null ? this._gridRecordsCount : this._searchCount, currentPage: this._currentPage() });
                                this._refreshGridPager();
                            }
							if(!this.model.scrollSettings.enableVirtualization)
								this._eventBindings();
                            break;
                        }
                    case ej.Grid.Actions.Grouping:
                        this._group(args);
                        this._refreshStackedHeader();
                        break;
                    case ej.Grid.Actions.BeginEdit:
                        this._edit(args);
                        break;
                    case ej.Grid.Actions.Add:
                        this._add(args);
                        break;
                    case ej.Grid.Actions.Ungrouping:
                        this._ungroup(args);
                        break;
                    case ej.Grid.Actions.VirtualScroll:
						if(!this._isVirtualRecordsLoaded){
							if(!this.model.scrollSettings.enableVirtualization)
								this._replacingContent();
							else
								this._replacingVirtualContent();
						}                        
                        break;
                }
            }else{
				if(args.requestType == "refresh" && this.model.currentViewData == 0 && !this.phoneMode)
					this.getContentTable().find("colgroup").first().replaceWith(this._getMetaColGroup());
				this._newungroup(args);  
			}
            this._showGridLines();
            this._completeAction(args);
        },
        _showGridLines: function () {
            var $lines = this.model.gridLines;
            if ($lines != "both") {
				this.getContent().addClass($lines != "none" ? "e-" + $lines + "lines" : "e-hidelines");
            }
        },
		_showHeaderGridLines: function(){
			var $lines = this.model.gridLines;
			if ($lines != "both") 
				this.getHeaderContent().addClass($lines != "none" ? "e-"+$lines+"lines" : "e-hidelines");
		},
        _newungroup: function (args) {
            if (args.requestType == "ungrouping")
                this._ungroup(args);
            else
                this.getContentTable().find('tbody').empty().first().append(this._getEmptyTbody());
        },
        setFormat: function () {
            var column = [];
            for (var i = 0 ; i < this.model.columns.length ; i++) {
                if (this.model.columns[i].type == "date") {
                    column.push(this.model.columns[i]);
                }
            }
            if (column.length > 0) {
                for (var i = 0 ; i < this.model.currentViewData.length ; i++) {
                    for (var j = 0 ; j < column.length ; j++) {
                        var data = this.model.currentViewData[i][column[j].field];
                        if (/^(\d{4}\-\d\d\-\d\d([tT][\d:\.]*)?)([zZ]|([+\-])(\d\d):?(\d\d))?$/.test(data))
                            this.model.currentViewData[i][column[j].field] = new Date(this.model.currentViewData[i][column[j].field]);
                    }
                }
            }
        },
        _completeAction: function (args) {
            if (this.model.editSettings.editMode.indexOf("dialog") != -1 && (args.requestType == "save" || args.requestType == "cancel") && $("#" + this._id + "_dialogEdit").data("ejDialog"))
                $("#" + this._id + "_dialogEdit").ejDialog("close");
            if (!(this.model.editSettings.showAddNewRow && this.model.editSettings.editMode == "normal"))
                this.model.isEdit = false;
            this._confirmedValue = false;
            if (ej.Grid.Actions.Grouping == args.requestType && ej.isNullOrUndefined(args.columnName))
                return;
            if ((args.columnSortDirection == "ascending" || args.columnSortDirection == "descending") && !ej.isNullOrUndefined(args.columnName)) {
                var scolumn = this.getColumnByField(args.columnName);
                if (this.model.allowSorting && this.model.allowMultiSorting)
                    this._scolumns.push(scolumn.field);
                else
                    this._gridSort = scolumn.field;
            }
            if (args.requestType != 'beginedit' && args.requestType != 'add')
                this.setWidthToColumns();
            if (args.requestType == "save" || args.requestType == "cancel" ||  args.requestType == "delete") {
                this._isAddNew = false;
                if (this.model.isResponsive && this.model.minWidth)
                    this.windowonresize();
            }
            if (!this.initialRender && (ej.Grid.Actions.UnGrouping == args.requestType || this.model.groupSettings.groupedColumns.length > 0) && !$("#" + this._id + "EditForm").length)
                this._recalculateIndentWidth();
            if (ej.Grid.Actions.Paging == args.requestType || ej.Grid.Actions.BatchSave == args.requestType)
                this._refreshGridPager();
            else if ((ej.Grid.Actions.Sorting == args.requestType && this.model.allowSorting) || ej.Grid.Actions.Refresh == args.requestType  || ej.Grid.Actions.Cancel == args.requestType) {
                if (ej.gridFeatures.sort && this.getHeaderTable() !== null)
                    this._sortCompleteAction(args);
                if (this.model.allowPaging) {
                    var pageModel = this.getPager().ejPager("option");
                    this._currentPage(pageModel.currentPage);
                    delete pageModel.currentPage;
                    $.extend(this.model.pageSettings, pageModel);
                    delete this.model.pageSettings.masterObject;
                    this._refreshGridPager();
                }
				if (!this.initialRender && (this.model.scrollSettings.frozenRows > 0 || this.model.scrollSettings.frozenColumns > 0))
                    this._refreshScroller(args);
                
            } else if (ej.Grid.Actions.Delete == args.requestType || ej.Grid.Actions.Save == args.requestType || ej.Grid.Actions.Search == args.requestType) {
                this._editEventTrigger(args);
				if (!this.initialRender && (this.model.scrollSettings.frozenRows > 0 || this.model.scrollSettings.frozenColumns > 0))
					this._refreshScroller(args);
                if (this.model.allowPaging)
                    this._refreshPagerTotalRecordsCount();
            } else if (ej.Grid.Actions.Filtering == args.requestType)
                this._filterCompleteAction();
            else if (ej.Grid.Actions.BeginEdit == args.requestType || ej.Grid.Actions.Add == args.requestType)
                this._editCompleteAction(args);
            else if (ej.Grid.Actions.Grouping == args.requestType || ej.Grid.Actions.Ungrouping == args.requestType)
                this["_" + args.requestType + "CompleteAction"](args);
            if (this.model.toolbarSettings.showToolbar || ((this.model.allowSorting || this.model.allowFiltering) && this.model.enableResponsiveRow))
                this.refreshToolbar();
            if (!this.initialRender && this.model.showSummary && this.model.summaryRows.length > 0) {
                if (this.model.currentViewData.length) {
                    if (!this.element.children(".e-gridfooter").length)
                        this._renderGridFooter().insertAfter(this.getContent());
                    this.getFooterTable().find('colgroup').remove();
                    this.getFooterTable().append(this.getHeaderTable().find("colgroup").clone());
                    this._createSummaryRows(this.getFooterTable());
                }
                else
                    this.element.children(".e-gridfooter").remove();
            }
            if (!this.initialRender && ej.gridFeatures.selection) {
                if (!this.getContent().find("td.e-selectionbackground").length)
                    this._setCurrentRow(args.requestType);
                if (args.requestType != "virtualscroll" && this.clearColumnSelection())
                    $(this.getHeaderTable().find("th.e-headercell")).removeClass("e-columnselection");
            }
            this.model.editSettings.editMode == "batch" && this.refreshBatchEditMode();
            if (!this.initialRender && (this.model.allowScrolling || this.model.isResponsive) && (this._checkScrollActions(args.requestType) || (this.model.editSettings.editMode.indexOf("inline") != -1 && args.requestType == "beginedit")) ||
                (this.model.scrollSettings.virtualScrollMode == "continuous" && args.requestType == "virtualscroll")){
                if(this.model.isResponsive && this.model.minWidth)
                    this.windowonresize()
                else
                    this._refreshScroller(args);
             }    
            if (this.model.scrollSettings.virtualScrollMode == "normal" && args.requestType == "virtualscroll")
                this.getContent().find("div:first").scrollLeft(this.getScrollObject().scrollLeft());
            if (this._customPop != null && args.requestType != "sorting") {
                this._customPop.hide();
            }
            if (this.model.allowScrolling && !this.initialRender && !this.model.scrollSettings.enableVirtualization)
                this.getContentTable().find("tr:last").find("td").addClass("e-lastrowcell");

            if (this.model.allowGrouping && this.model.showSummary)
                this._refreshGroupSummary();
            if (ej.Grid.Actions.Refresh == args.requestType && !this.initialRender && this.model.allowGrouping && this.model.groupSettings.groupedColumns.length > 0)
                this._groupingCompleteAction(args);
            if (ej.Grid.Actions.Refresh == args.requestType && !this.initialRender && this.model.allowGrouping && this.model.groupSettings.groupedColumns.length < 1)
                this._ungroupingCompleteAction(args);
            if (this.model.textWrapSettings)
                this._setTextWrap();
            if(!((this._isUngrouping || this._columnChooser  ) && ( args.requestType == "refresh") ) ){
				this._trigger("actionComplete", args);
				this._isUngrouping = false;
				this._columnChooser = false;
			}
			if(args.requestType != "refresh" || this._showHideColumns)
				this._trigger("refresh");		 			
            if ((this.model.editSettings.showAddNewRow && this.model.editSettings.editMode == "normal")) {
                
                if (!this.initialRender && this.getContentTable().find("tr.e-addedrow").length == 0 && this.element.find(".e-gridcontent").find("tr").length != 0)
                    this._startAdd();
                 if (args.requestType == "searching")
                    this.element.find(".e-gridtoolbar").find("li#" + this._id + "_search input").focus();
            }
            
            if ((ej.Grid.Actions.BeginEdit == args.requestType || ej.Grid.Actions.Add == args.requestType) && $.isFunction($.validator))
                this.setValidation();
            if (!this.initialRender)
                this.model._groupingCollapsed = [];
            if (this._updateDataSource && this._gridRecordsCount && this.model.allowFiltering) {
                this._initColumns(this.model.currentViewData[0] != undefined ? this.model.currentViewData[0] : this.model.currentViewData.value);
                this._renderFilterDialogs();
                this._updateDataSource = false;
            }
		    if (this.model.columnLayout == "fixed" && !this.model.isEdit)
		        this.setWidthToColumns();
		    if (this.model.allowRowDragAndDrop)
		        this._rowsDragAndDrop();
        },        
        _getDataIndex: function (data, item) {
            var flag = 0, _plen;
            for (var d = 0, len = data.length; d < len; d++) {
                for (var key = 0, _plen = this._primaryKeys.length; key < _plen; key++) {
                    if (this._checkPrimaryValue(data[d][this._primaryKeys[key]], item[this._primaryKeys[key]], this._primaryKeys[key]))
                        continue;
                    else if (key == _plen - 1)
                        flag = 1;
                }
                if (flag) return d;
            }
            return -1;
        },
        _checkPrimaryValue: function (keyData, keyItem, field) {
            if (this.getColumnByField(field).type == "string")
                keyData = keyData.trim();
            if (keyData != keyItem)
                return true;
            else
                return false;
        },
        _eventBindings: function () {
            var rowLength = this.model.scrollSettings.frozenColumns > 0 ? this._gridRows[0].length : this._gridRows.length;
            var trIndex = 0;
            var prev;
            var pageSize = this.model.pageSettings.pageSize;
            if (ej.gridFeatures.common)
                this._refreshUnboundTemplate(this.getContentTable());
            if (this._gridRecordsCount != 0) {
                if (this.model.queryCellInfo != null || this.model.rowDataBound != null || this.model.mergeCellInfo != null || this.model.templateRefresh != null) {
                    for (var row = 0; row < rowLength; row++) {
                        var rowIndex = null, trIndex = row, viewIndex, viewData;
                        if (this.model.scrollSettings.allowVirtualScrolling && row < pageSize) {
							if(!this.model.scrollSettings.enableVirtualization){
								for (var i = 0; i < this._cloneQuery.queries.length; i++)
									prev = this._cloneQuery.queries[i].fn == "onPage" &&  this._cloneQuery.queries[i].e.pageIndex - 1;
								var value = pageSize * prev; 
								if (value != 0) {
									rowIndex = this.getContentTable().find("tr[name=" + value + "]").eq(row);
									trIndex = rowIndex.index();
								}
							}
							else{
								rowIndex = $(this._gridRows).eq(row);
								viewIndex = parseInt($(rowIndex).attr("name"), 32);	
								if($.inArray(viewIndex, this._queryCellView) != -1)		
									continue;
								if(this._virtualLoadedRecords[viewIndex])
									viewData = this._virtualLoadedRecords[viewIndex][row % this._virtualRowCount];
								trIndex = viewIndex * this._virtualRowCount + (row % this._virtualRowCount);								
							}
                        }
						else if(this.model.scrollSettings.enableVirtualization)
							rowIndex = $(this._gridRows).eq(row);
                        rowIndex = rowIndex || this.getRowByIndex(trIndex);
                        if (rowIndex.hasClass("e-virtualrow") || ej.isNullOrUndefined(this._currentJsonData[row] || viewData))
                            break;
						var rowData = this.model.scrollSettings.enableVirtualization ? viewData : this._currentJsonData[row];
                        this._rowEventTrigger(rowIndex, rowData);                       
                    }
                }
            }
        },
        _rowEventTrigger: function (row, data) {
            var args = { row: row, data: data };
            this._trigger("rowDataBound", args);
            var tdCells = row.cells;
            var $tdRowcells = $(row).find(".e-rowcell");
            for (var cellIndex = 0; cellIndex < $tdRowcells.length; cellIndex++) {
                var args = { cell: $tdRowcells[cellIndex], data: data, text: $tdRowcells[cellIndex].innerHTML };
                var foreignKeyData = this._getForeignKeyData(args.data);
                if ($($tdRowcells[cellIndex]).hasClass("e-rowcell"))
                    args.column = this.model.columns[cellIndex];
                if (!ej.isNullOrUndefined(foreignKeyData))
                    args.foreignKeyData = foreignKeyData;
                if (this.model.allowCellMerging == true) {
                    this._cellMerging(args);
                    this._trigger("mergeCellInfo", args);
                }
                this._trigger("queryCellInfo", args);
                if ($($tdRowcells[cellIndex]).hasClass("e-templatecell")) {
                    var args = { cell: $tdRowcells[cellIndex], column: this.model.columns[cellIndex], data: data, rowIndex: $(row).index() };
                    this._trigger("templateRefresh", args);
                }
            }

        },

        setWidthToColumns: function () {
            var $cols1 = this.getContentTable().children("colgroup").find("col");
            var $cols2 = this.getHeaderTable().children("colgroup").find("col");
            var width = this.element.width(), frozenWidth = 0, columnsTotalWidth = 0, finalWidth=0, browserDetails = this.getBrowserDetails();
            if (this.model.groupSettings.groupedColumns.length && !this.model.allowScrolling && this.model.groupSettings.showGroupedColumn) {
                if (browserDetails.browser == "msie" && parseInt(browserDetails.version, 10) > 8)
                    $cols1.first().css("width", ((30 / width) * 100) + "%");
            }
            if (!ej.isNullOrUndefined(this.model.detailsTemplate)) {
                var headerIndx = this.model.groupSettings.groupedColumns.length;
                var contentIndx = this.model.groupSettings.groupedColumns.length != 0 ? 1 : 0;
                $cols1.eq(contentIndx).css("width", this._detailsOuterWidth);
                $cols2.eq(headerIndx).css("width", this._detailsOuterWidth);
            }
            this._detailColsRefresh();
            $cols1 = this._$headerCols;
            $cols2 = this._$contentCols;

            for (var i = 0; i < $cols2.length; i++) {
                if (this.model.allowResizeToFit && this.model.columns[i]["width"] === undefined) {
                    hCellIndex = this.model.groupSettings.groupedColumns.length ? (i + this.model.groupSettings.groupedColumns.length) : i;
                    var contentWidth = this._resizer._getContentWidth(i);
                    var cellDiv = this.getHeaderTable().find('.e-headercelldiv').eq(hCellIndex);
                    var headerWidth = this._resizer._getHeaderContentWidth(cellDiv);
                    if (this.model.editSettings.editMode == "normal" && (this.model.isEdit || this._isAddNew))
                        finalWidth = browserDetails.browser == "firefox" ? parseInt($cols1[i].style.width, 10) : $cols1.eq(i).width();
                    else {
                         finalWidth = contentWidth > headerWidth ? contentWidth : headerWidth;
					     finalWidth += parseInt(cellDiv.css("padding-left"), 10)
                    }
                    this.columnsWidthCollection[i] = finalWidth;
                    columnsTotalWidth += this.model.columns[i].visible ? finalWidth : 0;
                } else
                    columnsTotalWidth += this.model.columns[i].visible ? parseInt(this.model.columns[i]["width"], 10) : 0;
                if (this.model.columns[i]["priority"])
                        $cols2.eq(i).addClass("e-table-priority-" + this.model.columns[i]["priority"]);
				if (!ej.isNullOrUndefined(this.columnsWidthCollection[i])) {
                    $cols1.eq(i).width(this.columnsWidthCollection[i]);
                    $cols2.eq(i).width(this.columnsWidthCollection[i]);
                    
                } else if (this.model.allowScrolling) {
                    var colWidth = (width / this.model.columns.length).toFixed(2), bSize = (width / (this.model.scrollSettings.buttonSize || 18) / 100).toFixed(2), cWidth = colWidth - bSize;
                    $cols1.eq(i).css("width", cWidth + "px");
                    $cols2.eq(i).css("width", cWidth + "px");
                    this.model.columns[i].width = cWidth;
                    this.columnsWidthCollection[i] = parseFloat(cWidth);
                }
            }
            if (this.model.columnLayout == "fixed") {
                if (this.model.scrollSettings && this.model.scrollSettings.frozenColumns == 0) {
                    this.getHeaderTable().width(columnsTotalWidth);
                    this.getContentTable().width(columnsTotalWidth);
                }
                var headerTableWidth = this.model.scrollSettings.frozenColumns > 0 ? this.getHeaderTable().eq(0).width() + this.getHeaderTable().eq(1).width() : this.getHeaderTable().width();
                var operation = this.getHeaderContent().width() > headerTableWidth ? 'addClass' : 'removeClass';
                var headerTable = this.getHeaderTable();
                var contentTable = this.getContentTable();
                if (this.model.scrollSettings.frozenColumns > 0) {
                    headerTable = this.getVisibleColumnNames().length <= this.model.scrollSettings.frozenColumns ? this.getHeaderTable().eq(1) : this.getHeaderTable().eq(0);
                    contentTable = this.getVisibleColumnNames().length <= this.model.scrollSettings.frozenColumns ? this.getContentTable().eq(1) : this.getContentTable().eq(0);
                }
                headerTable[operation]('e-tableLastCell');
                contentTable[operation]('e-tableLastCell');
            }
            if (!this.model.allowScrolling && this.model.allowResizeToFit && columnsTotalWidth > width) {
                this.model.allowScrolling = true;
                this.model.scrollSettings.width = width;
                this.getHeaderTable().parent().addClass("e-headercontent");
                if (!this.model.scrollSettings.frozenColumns > 0)
                    this.getHeaderTable().width(width);
            }
            if (this.model.isEdit) {
                var clonedCol = $cols1.clone();
                var editedTr;
                if (this.model.editSettings.showAddNewRow)
                    editedTr = this.getContentTable().find(".e-editedrow");
                $colGroup = this.model.scrollSettings.frozenColumns > 0 ? this.getContent().find(".gridform").find("colgroup") : !ej.isNullOrUndefined(editedTr) && editedTr.length == 1 ? editedTr.find("colgroup") : $("#" + this._id + "EditForm").find("colgroup");
                this.model.scrollSettings.frozenColumns > 0 && $colGroup.first().empty().append(clonedCol.splice(0, this.model.scrollSettings.frozenColumns));
                $colGroup.last().empty().append(clonedCol);
                if (this.model.detailsTemplate != null || this.model.childGrid != null)
                    $colGroup.prepend(this._getIndentCol());
            }
            if (this.model.groupSettings.groupedColumns.length) {
                var $grouedColGroup = this.getContentTable().find(".e-recordtable").children("colgroup");
                for (var i = 0; i < $grouedColGroup.length; i++) {
                    var clonedCol = $cols1.clone();
                    var detailsWidth = this._detailsOuterWidth != null ? this._detailsOuterWidth : "30px";
                    if (this.model.detailsTemplate != null || this.model.childGrid != null) clonedCol.splice(0, 0, $(this._getIndentCol()).width(detailsWidth)[0]);
                    $grouedColGroup.eq(i).empty().append(clonedCol);
                }
            }
            if (this.model.scrollSettings.frozenColumns > 0) {
                var totalWidth = 0, frozenWidth;
                for (var i = 0; i < this.columnsWidthCollection.length; i++) {
                    totalWidth += parseInt(this.columnsWidthCollection[i], 10);
                    if (this.model.scrollSettings.frozenColumns - 1 == i)
                        frozenWidth = Math.ceil(totalWidth);
                }
                this.getContent().find(".e-frozencontentdiv").outerWidth(frozenWidth)
                    .end().find(".e-movablecontentdiv").outerWidth(totalWidth - frozenWidth);
                this.getHeaderContent().find(".e-frozenheaderdiv").outerWidth(frozenWidth)
                    .end().find(".e-movableheaderdiv").outerWidth(totalWidth - frozenWidth);
            }
        },
        _initialEndRendering: function () {
            // use this method to add behaviour after grid render.
            if (this.model.allowRowDragAndDrop)
                this._rowsDragAndDrop();
            if (this.model.editSettings.allowEditing || this.model.editSettings.allowAdding) {
                if (this.model.editSettings.editMode == "dialog" || this.model.editSettings.editMode == "dialogtemplate")
                    this.element.append(this._renderDialog());
                else if (this.model.editSettings.editMode == "externalform" || this.model.editSettings.editMode == "externalformtemplate")
                    this.element.append(this._renderExternalForm());
            }
            
            (this.model.editSettings.editMode == "batch" || this.model.editSettings.showDeleteConfirmDialog) && this._renderConfirmDialog();
            (this.model.scrollSettings.frozenColumns > 0 || this.model.scrollSettings.frozenRows > 0) && $("#" + this._id + 'AlertDialog').length == 0 && this._renderAlertDialog();
            if (this.model.allowMultiSorting || this.model.selectionType == "multiple")
                this._renderMultiTouchDialog();
            if (this.model.scrollSettings.frozenColumns > 0 && !this.model.allowScrolling) {
                this.getContent().remove();
                this.getHeaderTable().eq(1).remove();
                this._alertDialog.find(".e-content").text(this.localizedLabels.FrozenColumnsScrollAlert);
                this._alertDialog.ejDialog("open");
                return;
            }
            this.model.scrollSettings.allowVirtualScrolling && !this.model.scrollSettings.enableVirtualization && this._createPagerStatusBar();
            this._getRowHeights();
            if (this.element.width() != 0)
                this.model.allowScrolling && this._renderScroller();
            else if (this.model.allowScrolling && this.element.width() == 0) {
                var proxy = this, myVar = setInterval(function () {
                    if (proxy.element.width() != 0 && !ej.isNullOrUndefined(proxy.element.width())) {
                        proxy._renderScroller();
                        proxy._endRendering();
                        clearInterval(myVar);
                    }
                }, 100);
                return;
            }
           this._endRendering();
        },

        _endRendering: function () {
            if (!ej.isNullOrUndefined(this.getContent().data("ejScroller")) && this.model.allowScrolling)
                var scroller = this.getScrollObject();
            var css = this.model.enableRTL ? "e-summaryscroll e-rtl" : "e-summaryscroll";
            if (this.model.allowScrolling && this.model.showSummary && scroller._vScroll)
                this.element.find(".e-summaryrow.e-scroller").addClass(css);
            this._addMedia();
            if(this.model.allowScrolling && this.model.allowTextWrap && !this.model.scrollSettings.allowVirtualScrolling) this.getContent().first().ejScroller("refresh");
            if (this.model.scrollSettings.allowVirtualScrolling) {
                if (this._currentPage() == 1 && !this.model.scrollSettings.enableVirtualization)
                    this._virtualLoadedRecords[this._currentPage()] = this._currentJsonData;
                if(this.model.scrollSettings.enableVirtualization)
                    this._refreshVirtualView();				
                else
                    this._refreshVirtualContent();
                this.getContent().first().ejScroller("refresh");
                if (this.getContent().ejScroller("isVScroll")) {
                    this.element.find(".e-gridheader").addClass("e-scrollcss");
                    this.getHeaderTable().first().width(this.getContentTable().width());
                }
                else
                    this.element.find(".e-gridheader").removeClass("e-scrollcss");
            }
            if (this._selectedRow() != -1){
                this.model.currentIndex = this._selectedRow();
                this.selectRows(this._selectedRow());
            }
            if (this.model.allowFiltering && this.model.filterSettings.filterType == "filterbar" && !this.model.allowPaging && !this.model.scrollSettings.allowVirtualScrolling)
                this._createPagerStatusBar();
            if (ej.gridFeatures.common)
                this.rowHeightRefresh()
            if (ej.gridFeatures.filter && ["menu", "excel"].indexOf(this.model.filterSettings.filterType) != -1)
                this._refreshFilterIcon();
            if (this.model.allowGrouping && this.model.groupSettings.groupedColumns.length != 0)
                this._recalculateIndentWidth();
            if (this.initialRender && (!this.model.scrollSettings.enableVirtualization || this._gridRows.length < this._virtualRowCount))
                this._addLastRow();
        },

        _addLastRow: function () {
            var lastRowtd = this.getContentTable().find("tr:last").find("td"), rowHeight = 0;

            if (this.model.allowScrolling && !this.model.scrollSettings.allowVirtualScrolling && !ej.isNullOrUndefined(this.model.dataSource) && !ej.isNullOrUndefined(this.getRows())) {
                for (var i = 0; i < this.getRows().length; i++)
                    rowHeight += $(this.getRows()[i]).height();

                if (rowHeight < this.getContent().height() - 1)
                    lastRowtd.addClass("e-lastrowcell");
            }
            if(this.model.scrollSettings.allowVirtualScrolling && this.getContentTable().height() < this.getContent().height())
                lastRowtd.addClass("e-lastrowcell");
        },
        _addMedia: function () {
            if (typeof (this.model.scrollSettings.width) != "string" && this.model.scrollSettings.width > 0) {
                this._responsiveScrollWidth = this._originalScrollWidth = this.model.scrollSettings.width;
            }
            else
                this._originalScrollWidth = this.element.width();
            if (typeof (this.model.scrollSettings.height) != "string" && this.model.scrollSettings.height > 0)
                this._responsiveScrollHiehgt = this.model.scrollSettings.height;
            if (this.model.minWidth && this.model.isResponsive) {
                this._$onresize = $.proxy(this.windowonresize, this);
                $(window).bind("resize", this._$onresize);
                if ($.isFunction(window.matchMedia)) {
                    var mediaFilterObj = window.matchMedia("(max-width: 768px)");
                    this._mediaStatus = mediaFilterObj.matches;
                }
                this.windowonresize();
            }
        },
        _getNoncontentHeight: function () {
            var height = this.getHeaderContent().outerHeight();
            if (this.model.toolbarSettings.showToolbar)
                height += this.element.find('.e-gridtoolbar').outerHeight();
            if (this.model.allowPaging)
                height += this.element.find('.e-pager').outerHeight();
            if (this.model.allowGrouping && this.model.groupSettings.showDropArea)
                height += this.element.find('.e-groupdroparea').outerHeight();
            return height;
        },
        
        setDimension: function (height, width) {
            var originalHeight = height - this._getNoncontentHeight();
            this.model.scrollSettings.height = originalHeight;
            this.model.scrollSettings.width = width;
            this._renderScroller();
        },
        _mediaQueryUpdate: function (isScroller, elemHeight, width, winHeight) {
            if (window.innerWidth <= 320 && this.model.enableResponsiveRow) {
                var contentStyle=this.getContentTable()[0].style;
               if(contentStyle.removeAttribute)
                   contentStyle.removeAttribute('min-width');
               else        
                   contentStyle.removeProperty('min-width');
                var scrollObj = this.getContent().data('ejScroller');
                if (scrollObj)
                    this.getContent().ejScroller('destroy');
                return;
            }
            if (isScroller) {
                this.model.scrollSettings.width = ej.isNullOrUndefined(this._responsiveScrollWidth) ? width : Math.min(this._responsiveScrollWidth, width);
                var height = Math.min(winHeight, elemHeight) - this._getNoncontentHeight();
                height = ej.isNullOrUndefined(this._responsiveScrollHiehgt) ? height : Math.min(this._responsiveScrollHiehgt, height);
                height = this.model.scrollSettings.height != "auto" ? height - (parseInt(this.element.parent().css('margin-bottom')) + 1) : this.model.scrollSettings.height;
                 if (this.model.minWidth > width && elemHeight > winHeight)
                    height = height != "auto" ? height + this.model.scrollSettings.buttonSize : height ;
                if (ej.isNullOrUndefined(this.getRows()))
                    height = '100%';
                this.model.scrollSettings.height = height;
                this.element.find(".e-gridheader").first().find("div").first().addClass("e-headercontent");
                this._renderScroller();
            }
            else {
                this.model.scrollSettings.width = '100%';
                if (!ej.isNullOrUndefined(this._responsiveScrollWidth))
                    this.model.scrollSettings.width = Math.min(this._responsiveScrollWidth, width);
                var modifyHeight = Math.min(winHeight, elemHeight);
                var height = modifyHeight - this._getNoncontentHeight();
                if (!ej.isNullOrUndefined(this._responsiveScrollHiehgt))
                    height = Math.min(this._responsiveScrollHiehgt, height);
                height = this.model.scrollSettings.height != "auto" ? height - parseInt(this.element.parent().css('margin-bottom')) : this.model.scrollSettings.height;
                 if (ej.isNullOrUndefined(this.getRows()))
                    height = '100%';
                this.model.scrollSettings.height = height;
                this.element.find(".e-gridheader").first().find("div").first().addClass("e-headercontent");
                this._renderScroller();
            }
        },
        windowonresize: function () {
            this.model.scrollSettings.width = this._responsiveScrollWidth;
            var width, height;
            this.element.css("width", '100%');
            this.getContentTable().width('100%');
            this.getHeaderTable().width('100%');
            this.getContentTable().css('minWidth', this.model.minWidth);
            width = this.element.width();
            var winHeight = $(window).height() - this.element.offset()['top'];
            var rowCount = !ej.isNullOrUndefined(this.getRows()) ? this.getRows().length : 1;
            var isBody = this.element.parent().is($('body')) || this.element.parent().height() == $('body').height() || this.element.parent()[0].style.height == "";
            var originalElemHeight=this.getContentTable()[0].scrollHeight + this._getNoncontentHeight();
            var elemHeight = isBody ? winHeight : this.element.parent().height();
            originalElemHeight += parseInt(this.element.parent().css('margin-top'));
            var isScroller = this.model.minWidth > width || elemHeight <= originalElemHeight;
            this._mediaQueryUpdate(isScroller, elemHeight, width, originalElemHeight)
        },
        _removeMedia: function () {
            $(window).unbind("resize", this._$onresize);
            this.getContentTable().css("min-width", "");
            this.getHeaderTable().css("min-width", "");
            this.getContentTable().css("width", "");
            this.model.scrollSettings.width = "auto";
            if (this.getContent().data("ejScroller"))
                this.getContent().ejScroller("destroy");
        },
        _getRowHeights: function () {
            var trs = this.getRows();
            if (trs !== null) {
                this._rowHeightCollection = [];
                if (trs[1] !== undefined && trs[1].length && ((this.model.scrollSettings.frozenColumns > 0 && trs[0] !== undefined) || (trs[0] !== undefined && typeof trs[0].item !== "undefined" && typeof trs[0].length == "number" && typeof trs[1].item !== "undefined" && typeof trs[1].length == "number"))) {
                    frotrs = trs[0];
                    movtrs = trs[1];
                    for (var i = 0 ; i < frotrs.length ; i++) {
                        this._rowHeightCollection[i] = frotrs[i].offsetTop >= movtrs[i].offsetTop ? frotrs[i].offsetTop : movtrs[i].offsetTop;
                    }
                }
                else {
                    for (var i = 0 ; i < trs.length ; i++) {
                        this._rowHeightCollection[i] = trs[i].offsetTop;
                    }
                }
            }
            return this._rowHeightCollection;
        },
        _getEmptyTbody: function () {
            var $emptyTd = ej.buildTag('td.emptyrecord', this.localizedLabels.EmptyRecord, {}, { colSpan: this.model.columns.length });
            return $(document.createElement("tr")).append($emptyTd);
        },
        _getIndentCol: function () {
            return ej.buildTag("col", "", { width: "30px" });
        },
        _createSortElement: function () {
            return ej.buildTag('span.e-icon', "&nbsp;");
        },
        _createSortNumber: function (number, header) {
            if (header.css("text-align") == "right")
            return ej.buildTag('span.e-number', number, { "color": "white", "font-size": "9px", "text-align": "center", "float": "left" });
            else
            return ej.buildTag('span.e-number', number, { "color": "white", "font-size": "9px", "text-align": "center", "float": "right" });
        },
        _onFocusIn: function (e) {
           var proxy=this;
		   setTimeout(function(){proxy.element.removeClass('e-activefocusout')},0);
        },
        _onFocusOut: function (e) {
            var proxy=this;
            setTimeout(function(){
				proxy.element.addClass('e-activefocusout');
            },0)
        },
        _wireEvents: function () {
            this._on(this.element, ($.isFunction($.fn.tap) && this.model.enableTouch) ? "tap" : "click", this._clickHandler);
            this._on(this.element, ($.isFunction($.fn.tap) && this.model.enableTouch) ? "tap" : "click", ".e-gridheader", this._mouseClickHandler);
            if (this.model.enableFocusout) {
                this._on(this.element, "focusout", this._onFocusOut);
                this._on(this.element, "focusin", this._onFocusIn);
            }
            if (ej.gridFeatures.common) {
				this._on(this.element, ($.isFunction($.fn.doubletap) && this.model.enableTouch) ? "doubletap" : "dblclick", ".e-gridcontent > div:first", this._recorddblClickHandler);
                if (this.model.rightClick)
                    this._on(this.element, "contextmenu", this._rightClickHandler);
                this._on(this.element, "click", ".e-gridcontent", this._recordClick);
                this._enableRowHover();
                if (this.model.enableTouch)
                    this._on(this.element, "swipeleft swiperight", ".e-gridcontent div > .e-table", $.proxy(this._touchGrid, this));
                else
                    this.element.addClass("e-touch");
                this._on(this.element, "mousedown", ".e-gridheader", this._headerMouseDown);
                if (this.model.allowRowDragAndDrop && this.model.selectionType == "multiple")
                    this._on(this.element, "mousedown", ".e-gridcontent", this._contentMouseDown);
                this._on(this.element, "mouseover mouseleave", ".e-gridheader:first", this._headerHover);
                this._on(this.element, ej.eventType.mouseMove, ".e-gridheader:first", this._headerHover);
                this.model.allowResizeToFit && this._on(this.element, "dblclick", ".e-gridheader", this._headerdblClickHandler);
                if (this.model.allowResizing) {
                    this._on(this.element, ej.eventType.mouseMove,".e-gridheader:first", this._mouseMove);
                    this._on(this.element, "mouseup", this._mouseUp);
                }
                if (this.model.allowKeyboardNavigation) {
                    this.element[0].tabIndex = this.element[0].tabIndex == -1 ? 0 : this.element[0].tabIndex;
                    this.element[0].accessKey = (!ej.isNullOrUndefined(this.element[0].accessKey) && this.element[0].accessKey != "") ? this.element[0].accessKey : "e";
                    this._on(this.element, "keyup", this._keyDownHandler);
                }
            }
            if (ej.gridFeatures.edit) {
                this._enableEditingEvents();
                this._on(this.element, "click", ".e-gridcontent .e-unboundcelldiv", this._unboundClickHandler);
            }
            if (this.model.allowGrouping) {
                this._enableGroupingEvents();
                this._on(this.element, "mouseenter mouseleave", ".e-groupdroparea,.e-groupheadercell", this._dropAreaHover);

            }
            this._enableFilterEvents();
        },
        _enableFilterEvents: function () {
            if (this.model.allowMultiSorting || this.model.selectionType == "multiple" || this.model.allowFiltering)
                this._on($(document), "mousedown", this._docClickHandler);
            if (this.model.allowFiltering) {
                var proxy = this, $target;
                this._off(this.element, "keyup", ".e-filterbar input")._on(this.element, "keyup", ".e-filterbar input", this._filterBarHandler);
                this._on(this.element, "focus click", ".e-filterbar", this._filterBarClose);
            }
        },
        _docClickHandler: function (e) {
            var details = this.getBrowserDetails(), $target = $(e.target);
            if (this._customPop != null && this.element.find(e.target).length == 0)
                this._customPop.hide();
            if (this.model.allowFiltering) {
                if (this.model.filterSettings.filterType == "menu" || this.model.filterSettings.filterType == "excel") {
                    if (this._$colType && ($(e.target).find(".e-grid.e-dlgcontainer").length > 1 || $(e.target).find(".e-excelfilter").length > 1))
                        if (details.browser == "msie")
                            e.target.tagName != "BODY" && (!this.isExcelFilter ? this._closeFilterDlg() : this._excelFilter.closeXFDialog(e));
                        else
                            !this._isExcelFilter ? this._closeFilterDlg() : this._excelFilter.closeXFDialog(e);
                } else if (!$target.hasClass("e-filtertext") && !$target.hasClass("e-cancel"))
                    this.getFilterBar().find(".e-cancel").addClass("e-hide");
            }

        },
        _mouseClickHandler: function (e) {
            var $temp = $(e.target), $target;
            if (!(this.model.isResponsive || this.model.enableResponsiveRow) && $temp.closest(".e-grid").length != 0 && $temp.closest(".e-grid").attr("id") !== this._id) return;
            if (this.getHeaderTable().find('.e-columnheader').not('.e-stackedHeaderRow').css('cursor') == "col-resize")
                return;
            if ($(e.target).is(".e-ascending, .e-descending"))
                $target = $(e.target.parentNode);
            else if ($temp.hasClass('e-groupheadercell'))
                $target = $temp.children("div");
            else
                $target = $(e.target);
            if (this._$fDlgIsOpen && this.model.allowFiltering && (this.model.filterSettings.filterType == "menu" || this._isExcelFilter)) {
                $.fx.off = true;
                this._closeFDialog();
                $.fx.off = false;
            }
            this.getHeaderTable().find(".e-columnheader").find(".e-headercellactive").removeClass("e-headercellactive").removeClass("e-active");
            if ($target.hasClass("e-headercelldiv") || (!$target.hasClass("e-togglegroupbutton") && $target.closest(".e-headercelldiv").length && $.inArray($target[0].tagName, ["SELECT", "INPUT", "TEXTAREA"]) == -1)
                || ($target.closest(".e-groupheadercell").length && $(e.target).is(".e-ascending, .e-descending"))) {
                if (!this.model.allowSorting || ej.gridFeatures.sort === undefined)
                    return;
                $target = ($target.hasClass("e-headercelldiv") || $target.closest(".e-groupheadercell").length) ? $target : $target.closest(".e-headercelldiv");
                var columnName = $target.attr("ej-mappingname");
                var columnSortDirection = ej.sortOrder.Ascending;
                this._$prevSElementTarget = this._$curSElementTarget;
                this._$curSElementTarget = $target;
                if ($target.find('span').hasClass("e-ascending"))
                    var columnSortDirection = ej.sortOrder.Descending;
                else
                    var columnSortDirection = ej.sortOrder.Ascending;
                if (e["pointerType"] == "touch" && this._customPop != null && !this._customPop.is(":visible") && this._customPop.find(".e-sortdirect").hasClass("e-spanclicked"))
                    this._customPop.show();
                if (e["pointerType"] == "touch" && this._customPop != null && (this._customPop.find(".e-rowselect").is(":visible") || !this._customPop.find(".e-sortdirect").hasClass("e-spanclicked")) && this.model.allowMultiSorting) {
                    var $offset = $target.offset();
                    this._customPop.removeAttr("style");
                    this._customPop.offset({ left: $offset.left, top: $offset.top - this.getHeaderTable().find(".e-columnheader").height() - $target.height() }).find(".e-sortdirect").show().end()
                        .find(".e-rowselect").hide().end().show();
                }
                if (this.model.allowMultiSorting && (e.ctrlKey || this._enableSortMultiTouch))
                    this.multiSortRequest = true;
                if (e.shiftKey && $.inArray(columnName, this.model.groupSettings.groupedColumns) == -1) {
                    this._removeSortedColumnFromCollection(columnName);
                    this.multiSortRequest = true;
                    columnName = null;
                    this.sortColumn(columnName, columnSortDirection);
                }
                if (!ej.isNullOrUndefined(columnName))
                    this.sortColumn(columnName, columnSortDirection);
            } else if ($target.hasClass("e-togglegroupbutton") && this.model.allowGrouping) {
                var field = $target.parent().attr("ej-mappingname");
                $target.hasClass("e-togglegroup") && this.groupColumn(field);
                $target.hasClass("e-toggleungroup") && this.ungroupColumn(field);
            } else if ($target.hasClass("e-filtericon") || $target.hasClass("e-filteredicon") || $target.hasClass('e-responsivefilterColDiv') || $target.parent().hasClass('e-responsivefilterColDiv')) {
                var columnName = $target.parent().find(".e-headercelldiv").attr("ej-mappingname") || $target.attr("ej-mappingname") || $($target.parent()).attr("ej-mappingname");
                this._$prevFieldName = this._$curFieldName, currentColumn = this.getColumnByField(columnName);
                var localXFLabel = { True: this.localizedLabels.True, False: this.localizedLabels.False };
                if (this.model.allowFiltering) {
                    var proxy = this;
                    $.each(this.model.columns, function (indx, col) {
                        if (col.field == columnName) {
                            proxy._$colType = col.type;
                            proxy._$curFieldName = col.field;
                            proxy._$colFormat = col.format;
                            proxy._$filterType = col.filterType;
                            proxy._$colForeignKeyField = col.foreignKeyField ? col.foreignKeyField : col.field;
                            proxy._$colForeignKeyValue = col.foreignKeyValue;
                            proxy._$colDropdownData = col.dataSource;
                        }
                    });
                    if ((this.model.filterSettings.filterType == "menu" && this._$filterType != "excel") || (this.model.filterSettings.filterType == "excel" && this._$filterType == "menu")) {
                        var $id = "#" + this._id + "_" + this._$colType + "Dlg";
                        this._$menuDlgIsOpen = true;
                        if (this._$colType == "string") {
                            if (this._$colForeignKeyValue && this._$colDropdownData)
                                $("#" + this._id + "_acString").ejAutocomplete({ fields: { text: proxy._$colForeignKeyValue, key: proxy._$colForeignKeyField }, dataSource: proxy._$colDropdownData });
                            else
                                $("#" + this._id + "_acString").ejAutocomplete({ fields: { text: proxy._$curFieldName, key: this._getIdField() }, dataSource: this._dataSource() });
                        } else if (this._$colType == "date") {
                            if (this._$colFormat != undefined) {
                                this._$colFormat = this._$colFormat.replace("{0:", "").replace("}", "");
                                $($id).find(".e-datewidget .e-datepicker").ejDatePicker({ dateFormat: this._$colFormat.replace("{0:", "").replace("}", "") });
                            }
                            else
                                $($id).find(".e-datewidget .e-datepicker").ejDatePicker({ dateFormat: "MM/dd/yyyy" });
                        }
                        else if (this._$colType == "datetime") {
                            if (this._$colFormat != undefined) {
                                this._$colFormat = this._$colFormat.replace("{0:", "").replace("}", "");
                                $($id).find(".e-datetimewidget input").ejDateTimePicker({ dateFormat: this._$colFormat.replace("{0:", "").replace("}", "") });
                            }
                            this._setFilterFieldValues($id);
                        }
                    }
                    this._mediaStatus = document.documentElement.clientWidth < 768;
                    if (this.model.isResponsive && this._mediaStatus) {
                        var gridObj = this;
                        var $headerDiv = ej.buildTag('div.e-resFilterDialogHeaderDiv');
                        var $titleSapn = ej.buildTag('div.labelRes', '<span>Filter</span>');
                        if ($(".e-filterMenuBtn").length > 0)
                            $(".e-filterMenuBtn").remove();
                        var $dlgBtn = ej.buildTag('div.e-filterMenuBtn');
                        var $inputOk = ej.buildTag('input.e-resposnsiveFilterBtnLeft');
                        var $inputCancel = ej.buildTag('input.e-resposnsiveFilterBtnRight');

                        $headerDiv.append($titleSapn);
                        $headerDiv.css('width', '100%');
                        var $dlgClone = $($id).css('padding-left', '0px');
                        if ($target.parent().hasClass('e-responsivefilterColDiv') && $target.hasClass('e-filternone')) {
                            proxy._fltrClrHandler();
                            $target.remove();
                            $("#responsiveFilter").css('display', 'block');
                            // this.element.css('display', 'block');
                        }
                        else {
                            this.element.css('display', 'none');
                            setTimeout(function () { $("#responsiveFilter").css('display', 'none'), 0 });
                            if (!this._isExcelFilter && this._$filterType != "excel") {
                                var btnText = this.model.enableResponsiveRow ? 'OK' : 'Filter', clearText = this.model.enableResponsiveRow ? 'Cancel' : 'Clear';
                                $inputOk.ejButton({ text: btnText, type: 'button', click: $.proxy(this._fltrBtnHandler, this) });
                                $inputCancel.ejButton({
                                    text: clearText, type: 'button', click: function () {
                                        if (clearText == 'Clear') {
                                            proxy.element.css('display', 'block');
                                            proxy._fltrClrHandler();
                                        }
                                        $($id).css('display', 'none');
                                        if ($inputCancel.hasClass("e-resposnsiveFilterBtnRight"))
                                            proxy.element.css('display', 'block');
                                    }
                                });
                                if ($target.parent().hasClass('e-responsivefilterColDiv') && $target.hasClass('e-filternone')) {
                                    proxy._fltrClrHandler();
                                    $target.remove();
                                }
                                else {
                                    $dlgClone.addClass('e-resMenuFltr');
                                    $dlgClone.css('height', $(window).height() - 1).css('width', $(window).width() - 2);
                                    $dlgClone.find('.e-operator').addClass('e-resFilterOperator');
                                    $dlgClone.find('.e-value').addClass('e-resFilterOperator');
                                    var $btnContainer = $dlgClone.find('.e-dlgBtns').remove().addClass('e-filterMenuBtn');
                                    $dlgClone.append($dlgBtn.append($inputOk).append($inputCancel));
                                    if (ej.isNullOrUndefined($dlgClone.find('.e-resFilterDialogHeaderDiv')[0])) {
                                        $dlgClone.insertAfter(this.element);
                                        var $backIcon = ej.buildTag('div.e-resFilterleftIcon', '', {}, { closeDialogue: $id.slice(1), openDialogue: 'responsiveFilter' });
                                        var $spanIcon = ej.buildTag('span.e-icon e-resIcon e-responisveBack', '', {}, { closeDialogue: $id.slice(1), openDialogue: 'responsiveFilter' })
                                        $backIcon.click(function (e) {
                                            $dlgClone.css('display', 'none');
                                            if (gridObj.model.enableResponsiveRow)
                                                $("#responsiveFilter").css('display', 'block');
                                            else
                                                gridObj.element.css('display', 'block');
                                        })
                                        $headerDiv.append($backIcon.append($spanIcon));
                                        var $closeIcon = ej.buildTag('div.e-resFIlterRigthIcon', '', {}, { closeDialogue: $id.slice(1), gridEle: true });
                                        var $closeSpan = ej.buildTag('span.e-icon e-resIcon e-responisveClose', '', {}, { closeDialogue: $id.slice(1), gridEle: true })
                                        $closeIcon.click(function (e) {
                                            $dlgClone.css('display', 'none');
                                            gridObj.element.css('display', 'block');
                                        });
                                        var $ejWid = $($dlgClone.find('.e-value').find('input:last'));
                                        if (proxy._$colType == 'string') {
                                            var model = $($dlgClone.find('.e-value').find('input:last')).ejAutocomplete('model');
                                            $ejWid.ejAutocomplete('destroy').ejAutocomplete({
                                                enableDistinct: true, dataSource: model.dataSource, fields: model.fields, width: model.width, focusIn: function (args) {
                                                    var $dropdown = this.element.closest(".e-filterDialoge").find(".e-dropdownlist");
                                                    this.model.filterType = $dropdown.val();
                                                }
                                            });
                                        }
                                        $headerDiv.append($closeIcon.append($closeSpan));
                                        $dlgClone.prepend($headerDiv);
                                    }
                                    $dlgClone.find('.e-responsiveLabelDiv').remove();
                                    var $label = ej.buildTag('div.e-responsiveLabelDiv', '', { 'margin-left': '5%', 'font-size': '17px', 'margin-top': '5%' }).append(ej.buildTag('span', this.getHeaderTextByFieldName(columnName), { 'font-weight': 'bold' }));
                                    $label.insertAfter($dlgClone.find('.e-resFilterDialogHeaderDiv'));
                                    $dlgClone.fadeIn(100, "easeOutQuad", function () {
                                    });
                                }
                            }
                            else {
                                this._excelDlg = $id = "#" + this._id + this._$colType + "_excelDlg";
                                if (ej.isNullOrUndefined($dlgClone.find('.e-resFilterDialogHeaderDiv')[0])) {
                                    $inputOk.ejButton({
                                        text: 'OK', type: 'button', click: function (sender) {
                                            gridObj._excelFilter._openedFltr = $(gridObj._excelDlg);
                                            gridObj._excelFilter._fltrBtnHandler();
                                            gridObj._setResponsiveFilterIcon();
                                            gridObj.element.css('display', 'block');
                                        }
                                    });
                                    $inputCancel.ejButton({ text: 'Cancel', type: 'button', click: function () { $($id).css('display', 'none'); proxy.element.css('display', 'block') } });
                                    $($id).children().not('.e-searchcontainer').remove();
                                    var excelObj = this._excelFilter;
                                    var $backIcon = ej.buildTag('div.e-resFilterleftIcon', '', {}, { closeDialogue: $id.slice(1), openDialogue: 'responsiveFilter' });
                                    var $spanIcon = ej.buildTag('span.e-icon e-resIcon e-responisveBack', '', {}, { closeDialogue: $id.slice(1), openDialogue: 'responsiveFilter' })
                                    $backIcon.click(function (e) {
                                        $.proxy(gridObj._closeDivIcon(e), this);
                                    })
                                    $headerDiv.append($backIcon.append($spanIcon));
                                    var $closeIcon = ej.buildTag('div.e-resFIlterRigthIcon', '', {}, { closeDialogue: $id.slice(1), gridEle: true });
                                    var $closeSpan = ej.buildTag('span.e-icon e-resIcon e-responisveCustomFilter', '', {}, { closeDialogue: $id.slice(1), gridEle: true })
                                    $closeIcon.click(function (e) {
                                        $.proxy(gridObj._closeDivIcon(e), this);
                                    })
                                    if (proxy._$colType != 'boolean')
                                        $headerDiv.append($closeIcon.append($closeSpan));
                                    $($id).css('padding', '0px');
                                    var $searchContainer = $($id).css('height', $(window).height() - 2);
                                    $searchContainer.css('width', $(window).width() - 2);
                                    var $searchBox = $searchContainer.find('.e-searchcontainer .e-searchbox').css('margin-top', '10px');
                                    $searchBox.children().css('margin-top', '10px');
                                    var $checkBoxDiv = $searchContainer.find('.e-checkboxlist');
                                    var scrolWidth = $(window).width() * (97 / 100), scrollHeight = $(window).height() * (65 / 100);
                                    $($searchContainer.find('.e-searchcontainer')).addClass('e-resSearch');
                                    var $btn = $searchContainer.find('.e-resSearch .e-btncontainer').remove();
                                    $btn.find('input:first').css('width', '45.6%');
                                    $btn.find('input:first').addClass('e-resposnsiveFilterBtnLeft');
                                    $btn.find('input:last').addClass('e-resposnsiveFilterBtnRight');
                                    $searchContainer.find('.e-excelLabel').remove();
                                    var $labelDiv = ej.buildTag('div.e-excelLabel', 'Order Id', { 'font-weight': 'bold', 'margin-top': '10px' });
                                    var $searchBox = $searchContainer.find('.e-searchcontainer');
                                    $labelDiv.insertAfter($searchContainer.find('.e-searchcontainer .e-searchbox'));
                                    $searchContainer.prepend($headerDiv);
                                    $($id).append($dlgBtn.append($inputOk).append($inputCancel))
                                    $checkBoxDiv.ejScroller({ height: scrollHeight, width: scrolWidth }).ejScroller('refresh');
                                }
                                this._excelFilter.openXFDialog({ field: columnName, enableResponsiveRow: true, displayName: currentColumn.headerText, dataSource: this._dataSource(), position: { X: xPos, Y: yPos }, dimension: { height: $(window).height(), width: $(window).width() }, cssClass: "resFilter", type: this._$colType, format: this._$colFormat, localizedStrings: localXFLabel });
                                $($id).insertAfter(this.element);
                                !ej.isNullOrUndefined($($id).parents('.e-grid')[0]) && $($id).remove();
                                $closeIcon.click(function (e) {
                                    $(gridObj._excelDlg).css('display', 'none');
                                    var height = $(window).height() - 5, width = $(window).width();
                                    excelObj._openCustomFilter('equal');
                                    var $dlgClone = $id = $("#" + gridObj._id + gridObj._$colType + "_CustomFDlg").addClass('e-responsviesExcelFilter');
                                    if (ej.isNullOrUndefined($dlgClone.find('.e-resFilterDialogHeaderDiv')[0])) {
                                        var $headerDivCustom = ej.buildTag('div.e-resFilterDialogHeaderDiv');
                                        var $titleSapn = ej.buildTag('div.labelRes', '<span>Custom Filter</span>');
                                        $headerDivCustom.append($titleSapn);
                                        var $backIcon = ej.buildTag('div.e-resFilterleftIcon', '', {}, { closeDialogue: gridObj._id + gridObj._$colType + "_CustomFDlg", openDialogue: gridObj._excelDlg.slice(1) });
                                        var $spanIcon = ej.buildTag('span.e-icon e-resIcon e-responisveBack', '', {}, { closeDialogue: gridObj._id + gridObj._$colType + "_CustomFDlg", openDialogue: gridObj._excelDlg.slice(1) })
                                        $backIcon.click(function (e) {
                                            $dlgClone.css('display', 'none');
                                            if (gridObj.model.enableResponsiveRow)
                                                $("#responsiveFilter").css('display', 'block');
                                            else
                                                gridObj.element.css('display', 'block');
                                        });
                                        $headerDivCustom.append($backIcon.append($spanIcon));
                                        var $closeIconCust = ej.buildTag('div.e-resFIlterRigthIcon', '', {}, { closeDialogue: gridObj._id + gridObj._$colType + "_CustomFDlg", gridEle: true });
                                        var $closeSpan = ej.buildTag('span.e-icon e-resIcon e-responisveClose', '', {}, { closeDialogue: gridObj._id + gridObj._$colType + "_CustomFDlg", gridEle: true })
                                        $headerDivCustom.append($closeIconCust.append($closeSpan));
                                        $closeIconCust.click(function (e) {
                                            $dlgClone.css('display', 'none');
                                            gridObj.element.css('display', 'block');
                                        })
                                        $dlgClone.prepend($headerDivCustom);
                                        $dlgClone.insertAfter(gridObj.element);
                                        $dlgClone.find('.e-dlgfields').css('width', '100%');
                                        var $firstDiv = $dlgClone.find('.e-dlgfields:first').css('width', '92%').css('margin-left', '6%');
                                        $firstDiv.css('margin-top', '4%');
                                        var colName = $dlgClone.find('.e-dlgfields').find('.e-fieldset legend').text();
                                        var $labelDiv = ej.buildTag('div.e-responsiveLabelDiv', colName, { 'margin-left': '6%' });
                                        $labelDiv.insertAfter($firstDiv);
                                        var $fieldSet = $dlgClone.find('.e-dlgfields').find('.e-fieldset').find('table').css('width', '61%');
                                        $dlgClone.find('.e-dlgfields').find('.e-fieldset').replaceWith($fieldSet);
                                        var $fieldDiv = $fieldSet.parent('div').addClass('e-responsiveExcelFilterFieldDiv');
                                        var $ddl = $fieldSet.find('.e-dropdownlist')
                                        $fieldSet.find('.e-dropdownlist').each(function (index, object) {
                                            var ds = $(object).ejDropDownList('model.dataSource');
                                            var wid = $(window).width() * (40 / 100);
                                            $(object).ejDropDownList('destroy').ejDropDownList({ width: wid, popupWidth: wid + "px", dataSource: ds });
                                        });
                                        $fieldSet.find('.e-autocomplete').each(function (index, object) {
                                            var model = $(object).ejAutocomplete('model.dataSource');
                                            var wid = $(window).width() * (40 / 100);
                                            $(object).ejAutocomplete('destroy').ejAutocomplete({ width: wid, dataSource: model.dataSource, fields: model.fields });
                                        });
                                        $fieldSet.find('.e-datepicker').each(function (index, object) {
                                            var ds = $(object).ejDatePicker('model.dataSource');
                                            var wid = $(window).width() * (40 / 100);
                                            $(object).ejDatePicker('destroy').ejDatePicker({ width: wid });
                                        });
                                        var $okClone = $inputOk.clone(), $cancelClone = $inputCancel.clone();
                                        $okClone.ejButton({
                                            text: 'OK', type: 'button', click: function (sender) {
                                                gridObj._excelFilter._openedFltr = $dlgClone;
                                                gridObj._excelFilter._fltrBtnHandler();
                                                if ($dlgClone.hasClass('e-dlgcustom'))
                                                    $dlgClone.ejDialog('close');
                                                gridObj._setResponsiveFilterIcon();
                                                gridObj.element.css('display', 'block');
                                            }
                                        });
                                        $cancelClone.ejButton({ text: 'Cancel', type: 'button', click: function () { $dlgClone.ejDialog('close'); proxy.element.css('display', 'block') } });
                                        $dlgClone.append($dlgBtn.clone().append($okClone).append($cancelClone))
                                        var $btnContainer = $dlgClone.find('.e-dlgfields .e-btncontainer').remove();
                                        $btnContainer.find('input:first').addClass('e-resposnsiveFilterBtnLeft');
                                        $btnContainer.find('input:first').css('width', '45.6%')
                                        $btnContainer.find('input:last').addClass('e-resposnsiveFilterBtnRight');
                                    }
                                    gridObj.element.css('display', 'none');
                                    $dlgClone.ejDialog({ enableModal: false, height: height, width: width, position: { X: 0, Y: 0 }, enableResize: false, showHeader: false }).ejDialog('open');
                                })
                                var $searchdiv = ej.buildTag('div');
                            }
                        }
                    }
                    else {
                        $($id).ejDialog({ position: { X: "", Y: "" } });
						var docWidth = $(document).width(), dlgWidth = document.documentElement.clientWidth < 800 ? 200 : 250, xPos = $target.position().left + 18, yPos = $target.position().top + 2;
                        var filterDlgLargeCss = "e-filterdialoglarge";
                        dlgWidth = this._isExcelFilter ? this._excelFilter._dialogContainer.width() : dlgWidth;
                        if ($target.offset().left + 18 + dlgWidth > docWidth)
                            xPos = xPos - dlgWidth;
                        if (dlgWidth == 200)
                            filterDlgLargeCss = "";
                        if (!ej.isNullOrUndefined(this._$colType)) {
                            if ((this.model.filterSettings.filterType == "menu" && this._$filterType != "excel") || (this.model.filterSettings.filterType == "excel" && this._$filterType == "menu"))
                                $($id).ejDialog({ position: { X: xPos, Y: yPos }, width: dlgWidth, cssClass: filterDlgLargeCss })
                                .ejDialog("open");
                            else
                                this._excelFilter.openXFDialog({ field: columnName, displayName: currentColumn.headerText, dataSource: this._dataSource(), position: { X: xPos, Y: yPos }, type: this._$colType, format: currentColumn.format, foreignKey: currentColumn.foreignKeyField, foreignKeyType: currentColumn.originalType, foreignKeyValue: currentColumn.foreignKeyValue, foreignDataSource: currentColumn.dataSource, localizedStrings: localXFLabel });
                        }
                    }
                    this._setFilterFieldValues($id);
                    if (this._$colType == "number" && currentColumn["serverType"] != undefined)
                        $($id).find(".e-numerictextbox").ejNumericTextbox({ width: "100%",decimalPlaces: 0 });
                    else if(this._$colType == "number")
                        $($id).find(".e-numerictextbox").ejNumericTextbox({ width: "100%",decimalPlaces: 2 });
                    this._$prevColType = this._$colType;
                    this._$fDlgIsOpen = true;
                }
            }
        },
        _responsiveFilterClose: function () {
            this.element.css('display', 'block');
        },
        _clickHandler: function (e) {
            var $target = $(e.target),tempChooser = $("[id$='ccDiv'].e-grid.e-columnChooser"),fieldName, $form = $("#" + this._id + "EditForm"), index, columnIndex, rowIndex;
			if(tempChooser.length) {
                var  flag = true;
                for(var i = 0; i < tempChooser.length; i++){
                    if($target.parents(".e-ccButton").length|| $target.hasClass('e-ccButton')) flag = $(e.target).closest(".e-grid").attr("id")+"ccDiv" != tempChooser[i].id;
                    var obj = $("#"+tempChooser[i].id).ejDialog("instance");
                    if(obj.isOpened() && flag) {
                        obj.close();
                        $(".e-columnChoosertail").remove();
                        $(".e-columnChoosertailAlt").remove();
                    }
                }
            }
            if ($target.hasClass("e-button") && ($target.hasClass("e-disable") || $target.prop("disabled"))) return;
            if ($target.closest(".e-grid").attr("id") !== this._id) return;
            if ($target.closest("#" + this._id + "EditForm").length)
                return;
            if ($target.hasClass("e-rowcell") || $target.closest("td").is(".e-rowcell") || ($target.hasClass("e-headercell") && ((e.clientY - $target.offset().top) < ($target.height() / 4)))) {
                if (this._bulkEditCellDetails.cancelSave) {
                    this._bulkEditCellDetails.cancelSave = false;
                    return;
                }
                if (this.model.editSettings.editMode == "batch" && ($.isFunction($.validator) && $form.length && $form.validate().errorList.length > 0))
                    return;
                this.model.editSettings.editMode == "batch" && this.element.focus();
                index = $target.closest("tr").hasClass("e-insertedrow") ? this.model.groupSettings.groupedColumns.length : 0;
                var tempIndex = $target.closest(".e-rowcell").index() != -1 ? $target.closest(".e-rowcell").index() : $target.closest(".e-headercell").index() - this.model.groupSettings.groupedColumns.length;
                columnIndex = $target.hasClass("e-rowcell") ? $target.index() - index : tempIndex - index;
                columnIndex = (this.model.detailsTemplate != null || this.model.childGrid != null) ? columnIndex - 1 : columnIndex;
                if (this.model.scrollSettings.frozenColumns && ($target.closest(".e-movableheaderdiv").length || $target.closest(".e-movablecontentdiv").length))
                    columnIndex = columnIndex + this.model.scrollSettings.frozenColumns;
                rowIndex = this.getIndexByRow($target.closest("tr"));
                this._bulkEditCellDetails.columnIndex = columnIndex;
                this._bulkEditCellDetails.rowIndex = rowIndex;
                if (this.model.allowSelection && ej.gridFeatures.selection) {
                    if (this.model.selectionType == "multiple") {
                        if (e.ctrlKey || this._enableSelectMultiTouch) {
                            this.multiSelectCtrlRequest = true;
                        }
                        if (e.shiftKey) {
                            this.multiSelectShiftRequest = true;
                            if (this._allowcellSelection && rowIndex > -1)
                                this.selectCells([[rowIndex, [columnIndex]]]);
                            if (this._allowrowSelection && rowIndex > -1)
                                this.selectRows(this._previousIndex, this.getIndexByRow($target.closest('tr')), $target);
                                this._selectedRow(this.getIndexByRow($target.closest('tr')));
                            if (this._allowcolumnSelection && $target.hasClass("e-headercell") && !$target.hasClass("e-stackedHeaderCell") && ((e.clientY - $target.offset().top) < ($target.height() / 4)))
                                this.selectColumns(this._previousColumnIndex, columnIndex);
                        }
                        if (e["pointerType"] == "touch" && this._customPop != null && !this._customPop.is(":visible") && this._customPop.find(".e-rowselect").hasClass("e-spanclicked") && this.model.selectionSettings.selectionMode == "row")
                            this._customPop.show();
                        if (e["pointerType"] == "touch" && this._customPop != null && (this._customPop.find(".e-sortdirect").is(":visible") || !this._customPop.find(".e-rowselect").hasClass("e-spanclicked")) && this.model.selectionType == "multiple") {
                            this._customPop.removeAttr("style");
                            var offset = $target.offset();
                            this._customPop.offset({ top: 0, left: 0 }).offset({ left: offset.left, top: offset.top - this.getRowHeight() - $target.height() }).find(".e-sortdirect").hide().end()
                                .find(".e-rowselect").show().end().show();
                        }
                    }
                    if (!this.multiSelectShiftRequest) {
                        if (this._allowcellSelection && rowIndex > -1) {
                            var cellProto = this._checkCellSelectionByRow(rowIndex, columnIndex);
                            if ((this.model.selectionSettings.enableToggle && this.selectedRowCellIndexes.length == 1 && this.selectedRowCellIndexes[0].cellIndex.length==1 || (e.ctrlKey && this.model.selectionType == 'multiple')) && (cellProto != -1 && this.selectedRowCellIndexes.length > 0 && this.selectedRowCellIndexes[0].cellIndex.length > 0))
                                this.clearCellSelection(cellProto.rowIndex, columnIndex);
                            else
                                this.selectCells([[rowIndex, [columnIndex]]]);
                        }
                        if (this._allowrowSelection && rowIndex > -1) {
							var selectedIndex = this.getIndexByRow($target.closest('tr'));
							if(this.model.scrollSettings.enableVirtualization){
								var remain = rowIndex % this._virtualRowCount, viewIndex;							
								viewIndex = parseInt($($target).closest("tr").attr("name"), 32);																												
								selectedIndex = (viewIndex * this._virtualRowCount) - (this._virtualRowCount - remain);	
							}
                            if (this.model.selectionSettings.enableToggle && this.getSelectedRecords().length == 1 && $.inArray(this.getIndexByRow($target.closest('tr')), this.selectedRowsIndexes) != -1)
                                this.clearSelection(selectedIndex);
                            else
                                this.selectRows(this.getIndexByRow($target.closest('tr')), null, $target);
                        }
                        if (this._allowcolumnSelection && $target.hasClass("e-headercell") && !$target.hasClass("e-stackedHeaderCell") && ((e.clientY - $target.offset().top) < ($target.height() / 4))) {
                            if (this.model.selectionSettings.enableToggle && this.selectedColumnIndexes.length == 1 && $.inArray(columnIndex, this.selectedColumnIndexes) != -1)
                                this.clearColumnSelection(columnIndex);
                            else
                                this.selectColumns(columnIndex);
                        }
                        this.multiSelectCtrlRequest = false;
                    }
                    this.multiSelectShiftRequest = false;
                }

                fieldName = this.model.columns[this._bulkEditCellDetails.columnIndex]["field"];
                if ($target.closest(".e-rowcell").length && fieldName) {
                    this._tabKey = false;
                    this.model.editSettings.allowEditing && this.model.editSettings.editMode == ej.Grid.EditMode.Batch && this.editCell($.inArray($target.closest("tr").get(0), this.getRows()), fieldName);
                }
            }
            if ($target.hasClass("e-rowselect") || $target.hasClass("e-sortdirect")) {
                if (!$target.hasClass("e-spanclicked")) {
                    $target.addClass("e-spanclicked");
                    if ($target.hasClass("e-rowselect"))
                        this._enableSelectMultiTouch = true;
                    if ($target.hasClass("e-sortdirect"))
                        this._enableSortMultiTouch = true;
                } else {
                    $target.removeClass("e-spanclicked");
                    if ($target.hasClass("e-rowselect"))
                        this._enableSelectMultiTouch = false;
                    if ($target.hasClass("e-sortdirect"))
                        this._enableSortMultiTouch = false;
                    this._customPop.hide();
                }
            }
            if (ej.gridFeatures.common) {
                this.expandCollapse($target);
            }
            if ($target.is(".e-filtericon") && $target.closest(".e-detailrow").length != 0)
                e.preventDefault();
            if (this._$fDlgIsOpen && this.model.allowFiltering && (this.model.filterSettings.filterType == "menu" || this._isExcelFilter) && !$target.is(".e-filtericon") && $target.closest(".e-dlgcontainer").length != 1)
                this._closeFDialog();
            if (this.model.allowSearching && this._searchBar != null) {
                if ($target.is(this._searchBar.find(".e-cancel")))
                    this._searchBar.find("input").val("");
                else {
                    if (e.target.id == this._id + "_searchbar")
                        this._searchBar.find(".e-cancel").removeClass("e-hide");
                    else if (!this._searchBar.find(".e-cancel").hasClass("e-hide"))
                        this._searchBar.find(".e-cancel").addClass("e-hide");
                }
            }
        },
        _checkCellSelectionByRow: function (rowIndex, columnIndex) {
            for (var i = 0; i < this.selectedRowCellIndexes.length; i++) {
                if (this.selectedRowCellIndexes[i].rowIndex == rowIndex)
                    break;
            }
            if (i != this.selectedRowCellIndexes.length && $.inArray(columnIndex, this.selectedRowCellIndexes[i].cellIndex) != -1)
                return this.selectedRowCellIndexes[i];
            return -1;
        },
        
        _destroy: function () {
            /// <summary>This function is  used to destroy the Grid Object</summary>
            this.element.off();
            this.element.find(".e-gridheader").find(".e-headercontent,.e-movableheader")
                .add(this.getContent().find(".e-content,.e-movablecontent")).unbind('scroll');
            var editForm = $("#" + this._id + "EditForm");
            if (editForm.length) {
                var $formEle = editForm.find('.e-field'), $element;
                for (var i = 0; i < $formEle.length; i++) {
                    $element = $($formEle[i]);
                    if ($element.hasClass('e-datetimepicker'))
                        $element.ejDateTimePicker("destroy");
                    else if ($element.hasClass('e-datepicker'))
                        $element.ejDatePicker("destroy");
                    else if ($element.hasClass('e-dropdownlist'))
                        $element.ejDropDownList("destroy");
                }
                editForm.remove();
            }
            if (this._confirmDialog)
                this._confirmDialog.ejDialog("destroy");
            this.element.find('.e-dropdownlist').ejDropDownList('model.dataSource', []);
            if (this.model.showColumnChooser) {
                $("#" + this._id + "ccDiv").ejDialog("destroy");
                $("#" + this._id + "ccDiv").remove();
                $("#" + this._id + "_ccTail").remove();
                $("#" + this._id + "_ccTailAlt").remove();
            }
            if (this.model.allowFiltering && this.model.filterSettings.filterType == "excel")
                this._excelFilter.resetExcelFilter()
            if (this.model.allowReordering)
                $(".e-columndropindicator").remove();
            if (this.model.allowFiltering && this.model.filterSettings.filterType == "menu") {
                var proxy = this, $colType;
                $.each(this.model.columns, function (indx, col) {
                    $colType = col.type;
                    $("#" + proxy._id + $colType + "_ddinput_popup_wrapper").remove();
                    if ($colType == "string")
                        $("#" + proxy._id + "_stringDlg").find('.e-autocomplete').ejAutocomplete("destroy");
                    else if ($colType == "date")
                        $("#" + proxy._id + "_dateDlg").find('.e-datepicker').ejDatePicker("destroy");
                    else if ($colType == "datetime")
                        $("#" + proxy._id + "_datetimeDlg").find('.e-datetimepicker').ejDateTimePicker("destroy");
                    else if ($colType == "number")
                        $("#" + proxy._id + "_numberDlg").find('.e-numerictextbox').ejNumericTextbox("destroy");
                });
            }
            if (this._$onresize)
                $(window).unbind("resize", this._$onresize);
            this.element.empty().removeClass("e-grid " + this.model.cssClass);
            this.element.ejWaitingPopup("destroy");
            if (this.model.contextMenuSettings.enableContextMenu) {
                $("#" + this._id + "_Context").ejMenu('destroy');
                $("#" + this._id + "_Context").remove();
            }
        },
        _getLocalizedLabels: function (property) {
            return ej.getLocalizedConstants(this.sfType, this.model.locale);
        },
    });
    if (ej.gridFeatures.common)
        $.extend(ej.Grid.prototype, ej.gridFeatures.common);
    if (ej.gridFeatures.edit)
        $.extend(ej.Grid.prototype, ej.gridFeatures.edit);
    if (ej.gridFeatures.filter)
        $.extend(ej.Grid.prototype, ej.gridFeatures.filter);
    if (ej.gridFeatures.group)
        $.extend(ej.Grid.prototype, ej.gridFeatures.group);
    if (ej.gridFeatures.selection)
        $.extend(ej.Grid.prototype, ej.gridFeatures.selection);
    if (ej.gridFeatures.sort)
        $.extend(ej.Grid.prototype, ej.gridFeatures.sort);
    if (ej.gridFeatures.dragAndDrop)
        $.extend(ej.Grid.prototype, ej.gridFeatures.dragAndDrop);

    ej.Grid.Locale = ej.Grid.Locale || {};

    ej.Grid.Locale["default"] = ej.Grid.Locale["en-US"] = {
        EmptyRecord: "No records to display",
        GroupDropArea: "Drag a column header here to group its column",
        DeleteOperationAlert: "No records selected for delete operation",
        EditOperationAlert: "No records selected for edit operation",
        SaveButton: "Save",
        OkButton: "OK",
        CancelButton: "Cancel",
        EditFormTitle: "Details of ",
        AddFormTitle: "Add New Record",
        Notactionkeyalert: "This Key-Combination is not available",
        Keyconfigalerttext: "This Key-Combination has already been assigned to ",
        GroupCaptionFormat: "{{:headerText}}: {{:key}} - {{:count}} {{if count == 1 }} item {{else}} items {{/if}} ",
        BatchSaveConfirm: "Are you sure you want to save changes?",
        BatchSaveLostChanges: "Unsaved changes will be lost. Are you sure you want to continue?",
        ConfirmDelete: "Are you sure you want to Delete Record?",
        CancelEdit: "Are you sure you want to Cancel the changes?",
        PagerInfo: "{0} of {1} pages ({2} items)",
        FrozenColumnsViewAlert: "Frozen columns should be in grid view area",
        FrozenColumnsScrollAlert: "Enable allowScrolling while using frozen Columns",
        FrozenNotSupportedException: "Frozen Columns and Rows are not supported for Grouping, Row Template, Detail Template, Hierarchy Grid and Batch Editing",
        Add: "Add",
        Edit: "Edit",
        Delete: "Delete",
        Update: "Update",
        Cancel: "Cancel",
        Done: "Done",
        Columns: "Columns",
        SelectAll: "(Select All)",
        PrintGrid: "Print",
        ExcelExport: "Excel Export",
        WordExport: "Word Export",
        PdfExport: "PDF Export",
        StringMenuOptions: [{ text: "StartsWith", value: "StartsWith" }, { text: "EndsWith", value: "EndsWith" }, { text: "Contains", value: "Contains" }, { text: "Equal", value: "Equal" }, { text: "NotEqual", value: "NotEqual" }],
        NumberMenuOptions: [{ text: "LessThan", value: "LessThan" }, { text: "GreaterThan", value: "GreaterThan" }, { text: "LessThanOrEqual", value: "LessThanOrEqual" }, { text: "GreaterThanOrEqual", value: "GreaterThanOrEqual" }, { text: "Equal", value: "Equal" }, { text: "NotEqual", value: "NotEqual" }],
        PredicateAnd: "AND",
        PredicateOr: "OR",
        Filter: "Filter",
        FilterMenuCaption: "Filter Value",
        FilterbarTitle: "'s filter bar cell",
        MatchCase: "Match Case",
        Clear: "Clear",
        ResponsiveFilter: "Filter",
        ResponsiveSorting: "Sort",
        Search: "Search",
        DatePickerWaterMark: "Select date",
        NumericTextBoxWaterMark: "Enter value",
        EmptyDataSource: "DataSource must not be empty at initial load since columns are generated from dataSource in AutoGenerate Column Grid",
        ForeignKeyAlert: "The updated value should be a valid foreign key value",
        True: "true",
        False: "false",
        UnGroup: "Click here to ungroup",
        AddRecord: "Add Record",
        EditRecord: "Edit Record",
        DeleteRecord: "Delete Record",
        Save: "Save",
        Grouping: "Group",
        Ungrouping: "Ungroup",
        SortInAscendingOrder: "Sort In Ascending Order",
        SortInDescendingOrder: "Sort In Descending Order",
        NextPage: "Next Page",
        PreviousPage: "Previous Page",
        FirstPage: "First Page",
        LastPage: "Last Page",
        EmptyRowValidationMessage:"Atleast one field must be updated",
		NoResult: "No Matches Found"
    };
    ej.Grid.Actions = {
        /** Used to specify paging action in grid   */
        Paging: "paging",
        /** Used to specify sorting action in grid   */
        Sorting: "sorting",
        /** Used to specify filtering action in grid   */
        Filtering: "filtering",
        /** Used to specify begin edit action in grid   */
        BeginEdit: "beginedit",
        /** Used to specify saving action in grid   */
        Save: "save",
        /** Used to specify adding action in grid   */
        Add: "add",
        /** Used to specify deleting action in grid   */
        Delete: "delete",
        /** Used to specify cancelling action in grid   */
        Cancel: "cancel",
        /** Used to specify grouping action in grid   */
        Grouping: "grouping",
        /** Used to specify un-grouping action in grid   */
        Ungrouping: "ungrouping",
        /** Used to specify refresh action in grid   */
        Refresh: "refresh",
        /** Used to specify reordering action in grid   */
        Reorder: "reorder",
        /** Used to specify searching action in grid   */
        Search: "searching",
        /** Used to specify batch save action in grid   */
        BatchSave: "batchsave",
        /** Used to specify virtual scroll action in grid   */
        VirtualScroll: "virtualscroll"
    };

    ej.Grid.SummaryType = {
        /**  Creates grid with summary type as Average */
        Average: "average",
        /**  Creates grid with summary type as Minimum */
        Minimum: "minimum",
        /**  Creates grid with summary type as Maximum */
        Maximum: "maximum",
        /**  Creates grid with summary type as Count */
        Count: "count",
        /**  Creates grid with summary type as Sum */
        Sum: "sum",
        /**  Creates grid with summary type as TrueCount */
        TrueCount: "truecount",
        /**  Creates grid with summary type as FalseCount */
        FalseCount: "falsecount",
        /**  Creates grid with summary type as Custom */
        Custom: "custom"
    };

    ej.Grid.EditMode = {
        /**  Creates grid with editMode as Normal */
        Normal: "normal",
        /**  Creates grid with editMode as Dialog */
        Dialog: "dialog",
        /**  Creates grid with editMode as DialogTemplate */
        DialogTemplate: "dialogtemplate",
        /**  Creates grid with editMode as Batch */
        Batch: "batch",
        /**  Creates grid with editMode as ExternalForm */
        ExternalForm: "externalform",
        /**  Creates grid with editMode as ExternalFormTemplate */
        ExternalFormTemplate: "externalformtemplate",
        /**  Creates grid with editMode as InlineForm */
        InlineForm: "inlineform",
        /**  Creates grid with editMode as InlineTemplateForm */
        InlineTemplateForm: "inlineformtemplate"
    };

    ej.Grid.PrintMode = {
        /**  print all pages in grid */
        AllPages: "allpages",
        /**   print current pages in grid */
        CurrentPage: "currentpage",
    };
    ej.Grid.ResizeMode = {
        NextColumn: 'nextcolumn',
        Control: 'control'
    };
    ej.Grid.Rowposition = {
        /** Add new row in the top of the grid */
        Top: "top",
        /** Add new row in the bottom of the grid */
        Bottom: "bottom",
    };

    ej.Grid.FormPosition = {
        /**  Creates grid with formPosition as BottomLeft */
        BottomLeft: "bottomleft",
        /**  Creates grid with formPosition as TopRight */
        TopRight: "topright"
    };

    ej.Grid.ClipMode = {
        /** Render an ellipsis ("...") to represent clipped text **/
        Ellipsis: "ellipsis",
        /** Clips the text **/
        Clip: "clip",
        /** Render an ellipsis ("...") to represent clipped text and tooltip would be shown **/
        EllipsisWithTooltip: "ellipsiswithtooltip"
    };

    ej.Grid.EditingType = {
        /**  Allows to set edit type as string edit type */
        String: "stringedit",
        /**  Allows to set edit type as boolean edit type */
        Boolean: "booleanedit",
        /**  Allows to set edit type as numeric edit type */
        Numeric: "numericedit",
        /**  Allows to set edit type as drop down edit type */
        Dropdown: "dropdownedit",
        /**  Allows to set edit type as date picker edit type */
        DatePicker: "datepicker",
        /**  Allows to set edit type as date time picker edit type */
        DateTimePicker: "datetimepicker",
    };

    ej.Grid.UnboundType = {
        /** Used to specify unbound type as Edit   */
        Edit: "edit",
        /** Used to specify unbound type as Save   */
        Save: "save",
        /** Used to specify unbound type as Delete   */
        Delete: "delete",
        /** Used to specify unbound type as Cancel   */
        Cancel: "cancel"
    };

    ej.Grid.ToolBarItems = {
        /** Used to add toolbar item for adding records    */
        Add: "add",
        /** Used to add toolbar item for editing records    */
        Edit: "edit",
        /** Used to add toolbar item for deleting records    */
        Delete: "delete",
        /** Used to add toolbar item for updating records    */
        Update: "update",
        /** Used to add toolbar item for cancelling records    */
        Cancel: "cancel",
        /** Used to add toolbar item for searching records    */
        Search: "search",
        /** Used to add toolbar item for printing grid    */
        PrintGrid: "printGrid",
        /** Used to add toolbar item for exproting grid to excel    */
        ExcelExport: "excelExport",
        /** Used to add toolbar item for exporting grid to word    */
        WordExport: "wordExport",
        /** Used to add toolbar item for exporting grid to pdf    */
        PdfExport: "pdfExport"
    };

    ej.Grid.FilterType = {
        /**  Creates grid with filtering type as Menu */
        Menu: "menu",
        /**  Creates grid with filtering type as FilterBar */
        FilterBar: "filterbar",
        /** Creates grid with filtering type as Excel */
        Excel: "excel"
    };

    ej.Grid.FilterBarMode = {
        /** Used to set filter bar mode as Immediate mode */
        Immediate: "immediate",
        /** Used to set filter bar mode as OnEnter mode */
        OnEnter: "onenter"
    };

    ej.Grid.SelectionType = {
        /**  Support for Single selection only in grid */
        Single: "single",
        /**  Support for multiple selections in grid */
        Multiple: "multiple"
    };
    ej.Grid.ColumnLayout = {
         /**  Support for auto width in grid */
        Auto: "auto",
        /**  Support for fixed column width in grid */
        Fixed: "fixed"
    };
    ej.Grid.GridLines = {
        /**  Support for Show both the vertical and horizontal line in grid  */
        Both: "both",
        /**  Support for Hide both the vertical and horizontal line in grid  */
        None: "none",
        /**  Support for Shows the horizontal line only in grid */
        Horizontal: "horizontal",
        /**  Support for Shows the vertical line only in grid  */
        Vertical: "vertical",
    };

    ej.Grid.VirtualScrollMode = {
        /** Used to set the Normal mode virtual paging*/
        Normal: "normal",
        /** Used to set the Continuous mode virtual paging*/
        Continuous: "continuous"
    };

    ej.Grid.SelectionMode = {
        /**  Support for Row selection in grid */
        Row: "row",
        /**  Support for Cell selection in grid */
        Cell: "cell",
        /**  Support for Column selection in grid */
        Column: "column"
    };

    ej.Grid.WrapMode = {
        /**  Support for text wrap with both header and content in grid */
        Both: "both",
        /**  Support for text wrap with content alone in grid */
        Content: "content",
        /**  Support for text wrap with header alone in grid */
        Header: "header"
    };

    ej.Grid.exportAll = function (exportAction, gridIds) {
        ej.Grid.prototype["export"](exportAction, null, true, gridIds);
    };
})(jQuery, Syncfusion);;
(function ($, ej, undefined) {
    ej.gridFeatures = ej.gridFeatures || {};
    ej.gridFeatures.gridResize = function (instance) {
        this.$headerTable = instance.getHeaderTable();
        this.gridInstance = instance;
        this._colMinWidth = 15;
        this._$visualElement = $();
        this._currentCell = -1;
        this._allowStart = false;
        this._oldWidth = null;
        this._orgX = null;
        this._orgY = null;
        this._extra = null;
        this._expand = false;
        this._target = null;
        this._cellIndex = -1;
    }

    ej.gridFeatures.gridResize.prototype = {
        _mouseHover: function (e) {
            if (this._$visualElement.is(":visible"))
                return;
            this._allowStart = false;
            if ($(e.target).is(".e-headercelldiv"))
                e.target = e.target.parentNode;
            var $target = $(e.target);
			if ($(e.target).hasClass("e-filtericon") && ($(e.target).css("cursor") == "col-resize" || $(e.target).closest("tr").css("cursor") == "col-resize")) {
                $(e.target).css("cursor", "pointer");
                $(e.target).closest("tr").css("cursor", "pointer");
            }
            if ($target.hasClass("e-headercell")) {
                var _resizableCell = e.target;
                var location = _resizableCell.getBoundingClientRect(), _x = 0, _y = 0;
                if (e.type = "mousemove") {
                    _x = e.clientX;
                    _y = e.clientY;
                }
                else if (e.type = "touchmove") {
                    _x = evt.originalEvent.changedTouches[0].clientX;
                    _y = evt.originalEvent.changedTouches[0].clientY;
                }
                else if (e.type = "MSPointerMove") {
                    _x = e.originalEvent.clientX;
                    _y = e.originalEvent.clientY;
                }
                if (this.gridInstance.model.scrollSettings && this.gridInstance.model.scrollSettings.frozenColumns)
                    var _nlx = this.gridInstance.getHeaderContent().width() + this.gridInstance.element.children(".e-gridheader").find(".e-columnheader").offset().left;
                else
                    var _nlx = this.gridInstance.getHeaderTable().width() + this.gridInstance.element.children(".e-gridheader").find(".e-columnheader").offset().left;
                if (((_x >= (location.left + document.documentElement.scrollLeft + _resizableCell.offsetWidth - 5)) || ((_x <= (location.left + 3)))) && (_x < _nlx) && (_x >= location.left) && (_y <= location.top + document.documentElement.scrollTop + e.target.offsetHeight)) {
                    if (_x > location.left + 3)
                        var tempTarget = $(e.target).find(".e-headercelldiv");
                    else
                        var tempTarget = $(e.target).prevAll("th:visible:first").find(".e-headercelldiv");
                    if ((this.gridInstance.model.enableRTL && _x >= (location.left + 10)) || (_x >= ((this.gridInstance.element.find(".e-headercell").not('.e-detailheadercell').offset().left + 10) - window.pageXOffset))) {
                        if ((this.gridInstance.model.showStackedHeader || tempTarget.length) && $.inArray($(tempTarget).attr("ej-mappingname"), this.gridInstance._disabledResizingColumns) == -1) {
                            this.gridInstance.model.showStackedHeader && $($target.parents('thead')).find('tr').css("cursor", "col-resize");
                            !this.gridInstance.model.showStackedHeader && $target.parent().css("cursor", "col-resize");
                            if ($(e.target).hasClass('e-stackedHeaderCell'))
                                this._currentCell = this.gridInstance.getHeaderContent().find(".e-headercell:visible").index(_resizableCell);
                            else
                                this._currentCell = this.gridInstance.getHeaderContent().find(".e-headercell:visible").not(".e-stackedHeaderCell").index(_resizableCell);
                            this._allowStart = true;
                        }
                        else {
                            $target.parent().css("cursor", "pointer");
                            this._currentCell = -1;
                        }
                    }
                }
                else {
                    this.gridInstance.element.find(".e-columnheader").css("cursor", "pointer");
                    this._currentCell = -1;
                }
            }
        },
        _start: function (_x, _y) {
            var _myrow = this.gridInstance.getHeaderTable().find(".e-columnheader"), _top;
            var _cells, _mycel;
            if ($(this._target).hasClass('e-stackedHeaderCell'))
                _cells = _myrow.find(".e-headercell").not(".e-hide");
            else
                _cells = _myrow.find(".e-headercell").not(".e-stackedHeaderCell,.e-hide");
            if (this._currentCell != -1 && this._currentCell < _cells.length)
                _mycel = _cells[this._currentCell];
            if (typeof (_mycel) == 'undefined')
                return;
            var _j = _mycel.getBoundingClientRect();
            _top = this._tableY = _j.top + parseInt(navigator.userAgent.indexOf("WebKit") != -1 ? document.body.scrollTop : document.documentElement.scrollTop);
            if (this._allowStart) {
                var vElement = this._$visualElement = $(document.createElement('div'));
                _height = this.gridInstance.element.find(".e-gridcontent").first().height() + this.gridInstance.element.find(".e-gridheader").height();
                if (this.gridInstance.model.showStackedHeader && this.gridInstance.model.stackedHeaderRows.length > 0) {
                    var headerRow = this.gridInstance.getHeaderTable().find('tr.e-columnheader')
                    var lenght = headerRow.length;
                    var currentIndex = $(this._target).parent('tr')[0].rowIndex;
                    for (var i = 0; i < currentIndex; i++) {
                        _height = _height - $(headerRow[i]).height();
                    }
                    // _height = _height - $(".e-stackedHeaderRow").height();
                }
                vElement.addClass("e-reSizeColbg").appendTo(this.gridInstance.element).attr("unselectable", "on").css("visibility", "hidden");
                this.gridInstance._resizeTimeOut = setTimeout(function() {
                    vElement.css({ visibility: "visible", height: _height + 'px', cursor: 'col-resize', left: _x, top: _top, position: 'fixed' });
                }, 100);
                this._oldWidth = _mycel.offsetWidth;
                this._orgX = _x;
                this._orgY = _y;
                this._extra = _x - this._orgX;
                this._expand = true;
            }
            else {
                this._currentCell = -1;
            }
        },
        _mouseMove: function (e) {
            if (this._expand) {
                var _x = 0, _y = 0;
                if (e.type = "mousemove") {
                    _x = e.clientX;
                    _y = e.clientY;
                }
                else if (e.type = "touchmove") {
                    _x = evt.originalEvent.changedTouches[0].clientX;
                    _y = evt.originalEvent.changedTouches[0].clientY;
                }
                else if (e.type = "MSPointerMove") {
                    _x = e.originalEvent.clientX;
                    _y = e.originalEvent.clientY;
                }
                if (navigator.userAgent.indexOf("WebKit") != -1) {
                    _x = e.pageX;
                    _y = e.pageY;
                }
                _x += document.documentElement.scrollLeft;
                e.preventDefault();
                this._moveVisual(_x);
            }
            else
                this._mouseHover(e);
        },
        _getCellIndex: function (e) {
            var $target = $(e._target);
            var targetCell = e._target;
            var location = targetCell.getBoundingClientRect();
            var scrollLeft = navigator.userAgent.indexOf("WebKit") != -1 ? document.body.scrollLeft : document.documentElement.scrollLeft;
            if (this._orgX < location.left + 5 + scrollLeft)
                targetCell = $(targetCell).prevAll(":visible:first")[0];
            var hCellIndex = targetCell.cellIndex;
            var cellIndex = hCellIndex;
            if (e.gridInstance.model.groupSettings.groupedColumns.length) {
                cellIndex = hCellIndex - e.gridInstance.model.groupSettings.groupedColumns.length;
            }
            return cellIndex;
        },
        _reSize: function (_x, _y) {
            // Function used for Resizing the column
            var proxy = this;
            var resized = false, $content;
            if (this.gridInstance.model.scrollSettings && this.gridInstance.model.scrollSettings.frozenColumns)
                this._initialTableWidth = this.gridInstance.getHeaderTable().first().parent().width() + this.gridInstance.getHeaderTable().last().parent().width();
            else
                this._initialTableWidth = this.gridInstance.getHeaderTable().parent().width();
            !this.gridInstance.model.enableRTL && this._getResizableCell();
            if (this.gridInstance.model.scrollSettings && this.gridInstance.model.scrollSettings.frozenColumns > 0)
                var _rowobj = this.gridInstance.getHeaderTable().find('thead');
            else
                var _rowobj = $(this._target).parents('thead');
            if (this._currentCell != -1 && this._expand) {
                this._expand = false;
                var _childTH = $(this._target).hasClass('e-stackedHeaderCell') ? _rowobj.find(".e-headercell:not(.e-detailheadercell)").filter(":visible") : _rowobj.find(".e-headercell:not(.e-detailheadercell,.e-stackedHeaderCell)").filter(":visible");
                var _outerCell = _childTH[this._currentCell];
                var _oldWidth = _outerCell.offsetWidth;
                var _extra = _x - this._orgX;
                //Check whether the column minimum width reached
                if (parseInt(_extra) + parseInt(_oldWidth) > this._colMinWidth) {
                    if (_extra != 0)
                        _rowobj.css("cursor", 'default');
                    this._resizeColumnUsingDiff(_oldWidth, _extra);
                    $content = this.gridInstance.element.find(".e-gridcontent").first();
                    var scrollContent = $content.find("div").hasClass("e-content");                    
                    var browser = this.gridInstance.getBrowserDetails();
                    if (browser.browser == "msie" && this.gridInstance.model.allowScrolling) {
                        var oldWidth = this.gridInstance.getContentTable().width(), newwidth = this.gridInstance._calculateWidth();
                        if (this.gridInstance.model.scrollSettings && this.gridInstance.model.scrollSettings.frozenColumns > 0) {
                            this.gridInstance.getHeaderTable().last().width(newwidth - this.gridInstance.getHeaderContent().find(".e-frozenheaderdiv").width());
                            this.gridInstance.getContentTable().last().width(newwidth - this.gridInstance.getContent().find(".e-frozencontentdiv").width());
                            this.gridInstance.model.showSummary && this.gridInstance.getFooterTable().last().width(newwidth - this.gridInstance.getFooterContent().find(".e-frozenfootertdiv").width());
                        }
                        else {
                            if (newwidth > oldWidth) {
                                this.gridInstance.getHeaderTable().width(newwidth);
                                this.gridInstance.getContentTable().width(newwidth);
                                this.gridInstance.model.showSummary && this.gridInstance.getFooterTable().width(newwidth);
                            }
                        }
                        if (parseInt(browser.version, 10) > 8 && this.gridInstance.model.groupSettings && this.gridInstance.model.groupSettings.groupedColumns.length) {
                            if (newwidth > oldWidth) {
                                this.gridInstance.getContentTable().width(newwidth);
                                this.gridInstance.getContentTable().children("colgroup").find("col").first().css("width", (20 / $content.find("table").first().width()) * 100 + "%");
                            }
                            else {
                                this.gridInstance.getContentTable().css("width", "100%");
                                this.gridInstance._groupingAction(true);
                                this.gridInstance.getContentTable().children("colgroup").find("col").first().css("width", ((this.gridInstance.getHeaderTable().find("colgroup").find("col").first().width() / $content.find("table").first().width()) * 100).toFixed(2) + "%");
                            }
                        }
                        this.gridInstance.getHeaderTable().parent().scrollLeft($content.find(".e-content").scrollLeft() - 1);
                    }
                    this.gridInstance._colgroupRefresh();
                    if (this.gridInstance.model.allowTextWrap)
                        this.gridInstance.rowHeightRefresh();
                    if (this.gridInstance.model.groupSettings.groupedColumns.length && !this.gridInstance.model.isEdit)
                        this.gridInstance._recalculateIndentWidth();
                    if (this.gridInstance.pluginName != "ejGrid" || ej.getObject("resizeSettings.resizeMode", this.gridInstance.model) == ej.Grid.ResizeMode.NextColumn) {
                        var $headerCols = this.gridInstance.getHeaderTable().find('colgroup').find("col");
                        var $ContentCols = this.gridInstance.getContentTable().find('colgroup').find("col");
                        if (!ej.isNullOrUndefined(this.gridInstance.model.detailsTemplate)) {
                            this.gridInstance._detailColsRefresh();
                            $headerCols = this.gridInstance._$headerCols;
                            $ContentCols = this.gridInstance._$contentCols;
                        }
                        var nextCell = this._currentCell + 1;
                        var $headerCol = $headerCols.filter(this._diaplayFinder).eq(!this.gridInstance.model.allowGrouping || !ej.isNullOrUndefined(this.gridInstance.model.detailsTemplate) ? nextCell : nextCell + this.gridInstance.model.groupSettings.groupedColumns.length)
                        var newWidth = ($headerCol.width() - (_extra)) > this._colMinWidth ? $headerCol.width() - (_extra) : this._colMinWidth;
                        $headerCol.width(newWidth);
                        if (this.gridInstance.model.scrollSettings && this.gridInstance.model.scrollSettings.frozenColumns) {
                            if (nextCell >= 0 && nextCell < this.gridInstance.model.scrollSettings.frozenColumns && this._getFrozenResizeWidth() + _extra > this.gridInstance.element.find(".e-headercontent").first().width())
                                return;
                            $ContentCol = $ContentCols.filter(this._diaplayFinder).eq(nextCell);
                        }
                        else
                            $ContentCol = $ContentCols.filter(this._diaplayFinder).eq(!this.gridInstance.model.allowGrouping || !ej.isNullOrUndefined(this.gridInstance.model.detailsTemplate) ? nextCell : nextCell + this.gridInstance.model.groupSettings.groupedColumns.length);
                        $ContentCol.width(newWidth);
                        this.gridInstance._findColumnsWidth();
                        if (this.gridInstance.model.scrollSettings.frozenColumns > 0 && $(this._target).parent('tr').parents('div:first').hasClass('e-frozenheaderdiv')) {
                            this.gridInstance.getHeaderContent().find('.e-frozenheaderdiv').width(this._newWidth);
                            this.gridInstance.getContent().find('.e-frozencontentdiv').width(this._newWidth);
                            this.gridInstance.setWidthToColumns()
                        }
                    }
                    else if (this.gridInstance.model.scrollSettings.frozenColumns > 0 && $(this._target).parent('tr').parents('div:first').hasClass('e-frozenheaderdiv')) {
                        this.gridInstance.getHeaderContent().find('.e-frozenheaderdiv').width(this._newWidth);
                        this.gridInstance.getContent().find('.e-frozencontentdiv').width(this._newWidth);
                    }
                    else if (!this.gridInstance.model.scrollSettings.frozenColumns) {
                        var oldTableWidth = this.gridInstance.getHeaderTable().width();
                        this.gridInstance.getHeaderTable().width(oldTableWidth + parseInt(_extra));
                        this.gridInstance.getContentTable().width(oldTableWidth + parseInt(_extra));
                        this.gridInstance.model.scrollSettings.width += parseInt(_extra);
                        if (this.gridInstance.getContent().width() > this.gridInstance.getContentTable().width()) {
                            this.gridInstance.getContentTable().addClass('e-tableLastCell');
                            this.gridInstance.getHeaderTable().addClass('e-tableLastCell');
                        }
                        else {
                            this.gridInstance.getContentTable().removeClass('e-tableLastCell');
                            this.gridInstance.getHeaderTable().removeClass('e-tableLastCell');
                        }
                    }
                    if (!(browser.browser == "msie") && this.gridInstance.model.allowScrolling && this.gridInstance.model.scrollSettings.frozenColumns == 0) {
                        this.gridInstance.getHeaderTable().width("100%");
                        this.gridInstance.getContentTable().width("100%");
                        var tableWidth = this.gridInstance._calculateWidth();
                        if (tableWidth <= this.gridInstance.getContentTable().width() || this.gridInstance.getHeaderTable().width() > this.gridInstance.getContentTable().width()) {
                            this.gridInstance.getHeaderTable().width(tableWidth);
                            this.gridInstance.getContentTable().width(tableWidth);
                        }
                    }
                    if (this.gridInstance.model.allowResizing && this.gridInstance.getHeaderTable().find(".e-columnheader").css('cursor') == 'default') {
                        var cellIndex = this._currentCell;
                        var target = $(this._target), columnIndex = [], col = [];
                        var newWidth = _oldWidth + _extra;
                        var args = {};
                        if (this.gridInstance.model.showStackedHeader && target.hasClass("e-stackedHeaderCell")) {
                            var rowindex = target.parent(".e-stackedHeaderRow").index();
                            var stackedHeaderCell = target.parent(".e-stackedHeaderRow").children()[this._cellIndex].cellIndex;
                            var stackedHeaderColumns = this.gridInstance.model.stackedHeaderRows[rowindex].stackedHeaderColumns[stackedHeaderCell].column;
                            var columns = stackedHeaderColumns;
                            if (!(stackedHeaderColumns instanceof Array))
                                columns = stackedHeaderColumns.split(",");
                            for (var i = 0 ; i < columns.length; i++) {
                                var index = this.gridInstance.getColumnIndexByField(columns[i]);
                                columnIndex.push(index)
                                col.push(this.gridInstance.model.columns[index]);
                            }
                            args = { columnIndex: columnIndex, column: col, oldWidth: _oldWidth, newWidth: newWidth };
                        }
                        else
                        args = { columnIndex: cellIndex, column: this.gridInstance.model.columns[cellIndex], oldWidth: _oldWidth, newWidth: newWidth };
                        this.gridInstance._trigger("resized", args);
                    }
                    if (this.gridInstance.model.allowScrolling) {
                        this.gridInstance._scrollObject.refresh(this.gridInstance.model.scrollSettings.frozenColumns > 0);
                        if (!scrollContent && $content.find("div").hasClass("e-content"))
                            this.gridInstance.refreshScrollerEvent();
                        this.gridInstance._isHscrollcss();
                    }
                }

            }

            this._target = null;
            this._$visualElement.remove();
            this._expand = false;
            this._currentCell = -1;
            this._allowStart = false;

        },
        _getFrozenResizeWidth: function () {
            var $frozenColumnsCol = this.gridInstance.getHeaderTable().find('colgroup').find("col").slice(0, this.gridInstance.model.scrollSettings ? this.gridInstance.model.scrollSettings.frozenColumns : 0), width = 0;
            for (var i = 0; i < $frozenColumnsCol.length; i++) {
                if ($frozenColumnsCol.eq(i).css("display") != "none")
                    width += parseInt($frozenColumnsCol[i].style.width.replace("px", ""));
            }
            return width;
        },
        _diaplayFinder: function () {
            return $(this).css('display') != 'none';
        },
        _resizeColumnUsingDiff: function (_oldWidth, _extra) {
            var proxy = this, _extraVal;			
            this._currntCe = this._currentCell;
            
            var $headerCols = this.gridInstance.getHeaderTable().find('colgroup').find("col");
            var $ContentCols = this.gridInstance.getContentTable().find('colgroup').find("col");
            if (!ej.isNullOrUndefined(this.gridInstance.model.detailsTemplate || this.gridInstance.model.childGrid)) {
                this.gridInstance._detailColsRefresh();
                $headerCols = this.gridInstance._$headerCols;
                $ContentCols = this.gridInstance._$contentCols;
            }
            var $headerCol = $headerCols.filter(this._diaplayFinder).eq(!this.gridInstance.model.allowGrouping || !ej.isNullOrUndefined(this.gridInstance.model.detailsTemplate || this.gridInstance.model.childGrid) ? this._currentCell : this._currentCell + this.gridInstance.model.groupSettings.groupedColumns.length)
                    , $ContentCol, $footerCol, $frozenCols = $headerCols.slice(0, this.gridInstance.model.scrollSettings ? this.gridInstance.model.scrollSettings.frozenColumns : 0);
            var colWidth = $headerCol[0].style.width, isPercent = colWidth.indexOf("%") != -1;
            var _inlineWidth = (!colWidth || isPercent)? $(this._target).outerWidth() : colWidth;
            var indent = !isPercent ? _oldWidth / parseInt(_inlineWidth) : 1;
            _extraVal = _extra = _extra / indent
            var _newWidth = this._newWidth = parseInt(_extra) + parseInt(_inlineWidth);
            if (_newWidth > 0 && _extra != 0) {
                if (_newWidth < this._colMinWidth)
                    _newWidth = this._colMinWidth;
                var _extra = _newWidth - _oldWidth;
                if (this.gridInstance.model.scrollSettings && this.gridInstance.model.scrollSettings.frozenColumns) {
                    if (this._currentCell >= 0 && this._currentCell < this.gridInstance.model.scrollSettings.frozenColumns && this._getFrozenResizeWidth() + _extra > this.gridInstance.element.find(".e-headercontent").first().width())
                        return;
                    $ContentCol = $ContentCols.filter(this._diaplayFinder).eq(this._currentCell);
                }
                else
                    $ContentCol = $ContentCols.filter(this._diaplayFinder).eq(!this.gridInstance.model.allowGrouping || !ej.isNullOrUndefined(this.gridInstance.model.detailsTemplate || this.gridInstance.model.childGrid) ? this._currentCell : this._currentCell + this.gridInstance.model.groupSettings.groupedColumns.length);
                if (this.gridInstance.model.showSummary) {
                    this._$footerCols = this.gridInstance.getFooterTable().find('colgroup').find("col");
                    var colCount = this.gridInstance.model.columns.length;
                    if (this._$footerCols.length > colCount) this._$footerCols.splice(0, (this._$footerCols.length - colCount));
                    $footerCols = this._$footerCols;
                    $footerCol = $footerCols.filter(this._diaplayFinder).eq(this._currentCell);
                    $footerCol.outerWidth(_newWidth);
                }
                if ($(this._target).parent('tr').hasClass('e-stackedHeaderRow')) {
                    this._resizeStackedHeaderColumn($(this._target).parent('tr'), _extraVal, this._currntCe);
                }
                else
                    $headerCol.outerWidth(_newWidth);
                if ($(this._target).parent('tr').hasClass('e-stackedHeaderRow')) {
                    if (this.gridInstance.model.groupSettings.groupedColumns.length) {
                        var $tables = this.gridInstance.getContentTable().find(".e-recordtable");
                        var $colGroup = $tables.find("colgroup");
                        for (var i = 0; i < this._changedcell.length; i++) {
                            var cellIndex = this._changedcell[i];
                            for (var j = 0 ; j < $colGroup.length; j++) {
                                var visibleCols = $($colGroup[j]).children().filter(this._diaplayFinder);
                                var width = parseInt((_extraVal)) + parseInt(visibleCols[cellIndex].style.width);
                                if (width < this._colMinWidth)
                                    width = this._colMinWidth
                                $(visibleCols[cellIndex]).width(width);
                            }
                        }
                    }
                    var length = this.gridInstance.getContentTable().find('colgroup').find("col").filter(this._diaplayFinder).length;
                    for (var i = 0; i < this._changedcell.length; i++) {
                        var $conCol = this.gridInstance.getContentTable().find('colgroup').find("col").filter(this._diaplayFinder)[this._changedcell[i]]
                        var width = parseInt((_extraVal)) + parseInt($conCol.style.width);
                        if (width < this._colMinWidth)
                            width = this._colMinWidth
                        $($conCol).outerWidth(width);
                        if (this.gridInstance.model.isEdit && (this.gridInstance.model.allowGrouping && this.gridInstance.model.groupSettings.groupedColumns.length == 0)) {
                            $sEditCol = this.gridInstance.getContentTable().find(".gridform").find("colgroup col").filter(this._diaplayFinder)[this._changedcell[i]];
                            $($sEditCol).outerWidth(width);
                        }
                    }
                }
                else {
                    if (this.gridInstance.model.groupSettings && this.gridInstance.model.groupSettings.groupedColumns.length) {
                        var $tables = this.gridInstance.getContentTable().find(".e-recordtable");
                        var $colGroup = $tables.find("colgroup");
                        var cellIndex = this._currentCell;
                        var colCount = this.gridInstance.getVisibleColumnNames().length;
                        if (this.gridInstance.getContentTable().find('.e-detailrow').length)
                            $colGroup = $colGroup.not($tables.find(".e-detailrow").find("colgroup")).get();
                        for (var i = 0 ; i < $colGroup.length; i++) {
                            var cols = $($colGroup[i]).find("col").filter(this._diaplayFinder);
                            if (cols.length > colCount) cols.splice(0, (cols.length - colCount));
                            $(cols[cellIndex]).width(_newWidth);
                        }
                    }
                    $ContentCol.outerWidth(_newWidth);
                    if (this.gridInstance.model.isEdit) {
                        var $editableRow = this.gridInstance.getContentTable().find(".e-editedrow,.e-addedrow");
                        var $editCols = $editableRow.find("table").find("colgroup col");
                        var addCol;
                        if ($editableRow.hasClass("e-addedrow") && this.gridInstance.model.groupSettings.groupedColumns.length)
                            addCol = this._currentCell + this.gridInstance.model.groupSettings.groupedColumns.length - 1;
                        else
                            addCol = this._currentCell;
                        var $editCol = $editCols.filter(this._diaplayFinder).eq(addCol);
                        $editCol.outerWidth(_newWidth);
                    }
                }
                this.gridInstance._findColumnsWidth();
                if (this.gridInstance.model.scrollSettings && this.gridInstance.model.scrollSettings.frozenColumns && ej.getObject("resizeSettings.resizeMode", this.gridInstance.model) != ej.Grid.ResizeMode.NextColumn) {
                    var frozenColumns = this.gridInstance.getContentTable().find('colgroup').find("col").slice(0, this.gridInstance.model.scrollSettings.frozenColumns)
                        , width = 0, direction;
                    for (i = 0; i < frozenColumns.length; i++)
                        width += frozenColumns[i].style.display == 'none' ? 0 : parseInt(frozenColumns[i].style.width.replace("px", ""));
                    this.gridInstance.getHeaderContent().find(".e-frozenheaderdiv").width(width);
                    direction = this.gridInstance.model.enableRTL ? "margin-right" : "margin-left";
                    this.gridInstance.getContent().find(".e-frozencontentdiv").width(width).next().css(direction, width + "px");
                    this.gridInstance.getHeaderContent().find(".e-frozenheaderdiv").width(width).next().css(direction, width + "px");
                    this.gridInstance.model.showSummary && this.gridInstance.getFooterContent().find(".e-frozenfooterdiv").width(width);
                }
                this.gridInstance.getHeaderTable().find(".e-columnheader").css("cursor", "default");
            }
        },
        _resizeStackedHeaderColumn: function (currentTr, extra, currentCell) {
            // var currentIndex = this._currntCe;
            this._changedcell = [];
            var headerCells = this.gridInstance.getHeaderContent().find(".e-headercell").not(".e-detailheadercell");
            var preCol = 0, limit = 0, currentTh = headerCells[currentCell], currentSpan = $(currentTh).attr('colspan'), commonExtra = extra / currentSpan, tr = $(currentTh).parent('tr');
            var nextTr = tr.next();
            var currentIndex = currentTh.cellIndex;
            if (this.gridInstance.model.groupSettings.showGroupedColumn) {
                limit = this.gridInstance.model.groupSettings.groupedColumns.length;
                preCol += limit
            }
            while (currentIndex > limit) {
                currentIndex--;
                var th = $(tr).children('th').not(".e-detailheadercell")[currentIndex];
                preCol += parseInt($(th).attr('colspan'));
            }
            this._currentCell = preCol;
            var length = preCol + parseInt(currentSpan);
            for (var i = preCol; i < length; i++) {
                var $colG = this.gridInstance.getHeaderTable().find('col').filter(this._diaplayFinder)[i];
                this._changedcell.push(i - limit)
                var width = parseInt(extra) + parseInt($colG.style.width);
                if (width < this._colMinWidth)
                    width = this._colMinWidth;
                $($colG).outerWidth(width);
             }
        },
        _triggerResizeEvents: function (event, _x) {
            var _rowobj = this.gridInstance.getHeaderTable().find(".e-columnheader");
            var _childTH = _rowobj.find(".e-headercell").filter(":visible");
            var cellIndex = this._cellIndex;
            var target = $(this._target), columnIndex = []; col = [];
            if (event == "resizeStart") {
                this._orgX = _x;
                cellIndex = this._cellIndex = this._getCellIndex(this, _x);
            }
            var _outerCell = _childTH[this._currentCell];
            var _oldWidth = _outerCell.offsetWidth;
            if (this.gridInstance.model.showStackedHeader && target.hasClass("e-stackedHeaderCell")) {
                var rowindex = target.parent(".e-stackedHeaderRow").index();
                var stackedHeaderCell = target.parent(".e-stackedHeaderRow").children()[this._cellIndex].cellIndex;
                var stackedHeaderColumns = this.gridInstance.model.stackedHeaderRows[rowindex].stackedHeaderColumns[stackedHeaderCell].column;
                var columns = stackedHeaderColumns;
                if (!(stackedHeaderColumns instanceof Array))
                    columns = stackedHeaderColumns.split(",");
                for (var i = 0 ; i < columns.length; i++) {
                    var index = this.gridInstance.getColumnIndexByField(columns[i]);
                    columnIndex.push(index)
                    col.push(this.gridInstance.model.columns[index]);
                }
            }
            if (event == "resizeStart") {
                var args = {};
                if (this.gridInstance.model.showStackedHeader && target.hasClass("e-stackedHeaderCell")) {
                    args = { columnIndex: columnIndex, column: col, target: target, oldWidth: _oldWidth };
                }
                else
                    args = { columnIndex: cellIndex, column: this.gridInstance.model.columns[cellIndex], target: $(_outerCell), oldWidth: _oldWidth };
                return this.gridInstance._trigger("resizeStart", args);
            }
            else {
                var _childth = _rowobj.find(".e-headercell").not(".e-detailheadercell").filter(":visible");
                var _extra = _x - this._orgX;
                var newWidth = _oldWidth + _extra;
                this.gridInstance._colgroupRefresh();
                var args = {};
                if (this.gridInstance.model.showStackedHeader && target.hasClass("e-stackedHeaderCell")) {
                    args = { columnIndex: columnIndex, column: col, target: $(_outerCell), oldWidth: _oldWidth, newWidth: newWidth, extra: _extra };
                }
                else
                    args = { columnIndex: cellIndex, column: this.gridInstance.model.columns[cellIndex], target: $(_outerCell), oldWidth: _oldWidth, newWidth: newWidth, extra: _extra };
                return this.gridInstance._trigger("resizeEnd", args);
            }
        },
        _mouseUp: function (e) {
            if (this.gridInstance._resizeTimeOut){
                clearTimeout(this.gridInstance._resizeTimeOut);
                this.gridInstance._resizeTimeOut = 0;
            }
            if (this._expand) {
                var _x = e.clientX, _y = e.clientY;
                if (navigator.userAgent.indexOf("WebKit") != -1) {
                    _x = e.pageX;
                    _y = e.pageY;
                }
                if (this.gridInstance.model.allowResizing && this.gridInstance.getHeaderTable().find(".e-columnheader").css('cursor') == 'col-resize') {
                    if (this._triggerResizeEvents("resizeEnd", _x)) {
                        this.gridInstance.element.find(".e-reSizeColbg").remove();
                        return;
                    }
                }
                _x += document.documentElement.scrollLeft;
                this._reSize(_x, _y);
                if (!ej.isNullOrUndefined(this._currntCe) && this._currntCe >= 0)
                    this.gridInstance.model.columns[this._currntCe].width = this.gridInstance.columnsWidthCollection[this._currntCe];
            }
        },
        _getResizableCell: function () {
            var row;
            if ($(this._target).hasClass('e-stackedHeaderCell'))
                row = this.gridInstance.getHeaderTable().find(".e-columnheader");
            else
                row = this.gridInstance.getHeaderTable().find(".e-columnheader").not('.e-stackedHeaderRow');
            var cell = row.find(".e-headercell").not(".e-hide,.e-detailheadercell");
            var scrollLeft = navigator.userAgent.indexOf("WebKit") != -1 ? document.body.scrollLeft : document.documentElement.scrollLeft;
            for (var i = 0; i < cell.length; i++) {
                point = cell[i].getBoundingClientRect();
                var xlimit = point.left + scrollLeft + 5;
                if (xlimit > this._orgX && $(cell[i]).height() + point.top >= this._orgY) {
                    this._currentCell = i - 1;
                    return;
                }
                if (i == cell.length - 1 || (this.gridInstance.model.showStackedHeader && $(this._target).get(0) === cell[i])) {
                    this._currentCell = i;
                    return;
                }
            }
        },
        _moveVisual: function (_x) {
            /// Used to move the visual element in mouse move
            var _bounds = this.gridInstance.getHeaderContent().find("div").first()[0].getBoundingClientRect();
            if ((_bounds.left + document.documentElement.scrollLeft + _bounds.width < _x) || (_x < _bounds.left + document.documentElement.scrollLeft))
                this._$visualElement.remove();
            else if (this._currentCell != -1)
                this._$visualElement.css({ left: _x, top: this._tableY });
        },
        _mouseDown: function (e) {
            if (this._allowStart && ($(e.target).closest("tr").css("cursor") == 'col-resize')) {
                this._target = e.target;
                var _x = e.clientX, _y = e.clientY;
                if (navigator.userAgent.indexOf("WebKit") != -1) {
                    _x = e.pageX;
                    _y = e.pageY - document.body.scrollTop;
                }
                if (this.gridInstance.model.allowResizing && this.gridInstance.getHeaderTable().find(".e-columnheader").css('cursor') == 'col-resize') {
                    if ($(e.target).is(".e-headercelldiv"))
                        e.target = e.target.parentNode;
                    this._target = e.target;
                    if (this._triggerResizeEvents("resizeStart", _x))
                        return;
                }
                var gridobj = this;
                _x += document.documentElement.scrollLeft;
                if (e.button != 2)
                    this._start(_x, _y);
                return false;
            }
            return true;
        },
        _columnResizeToFit: function (e) {
            var resize = this.gridInstance.getHeaderTable().find(".e-columnheader").filter(function (e) {
                return $(this).css("cursor") == "col-resize";
            });
            if (this.gridInstance.model.allowResizeToFit && resize.length) {
                if ($(e.target).is(".e-headercelldiv"))
                    e.target = e.target.parentNode;
                var $target = $(e.target);
                var headerCells, preCol = 0, indent = 0;
                if ($target.hasClass('e-stackedHeaderCell'))
                    headerCells = this.gridInstance.getHeaderContent().find(".e-headercell").not(".e-detailheadercell");
                else
                    headerCells = this.gridInstance.getHeaderContent().find(".e-headercell").not(".e-stackedHeaderCell,.e-detailheadercell");
                this._target = $target;
                if ($target.hasClass("e-headercell")) {
                    var targetCell = e.target;
                    var hCellIndex = $.inArray(targetCell, headerCells);
                    var cellIndex = hCellIndex;
                    this._orgX = e.pageX;
                    if(!this.gridInstance.model.enableRTL) 
						this._getResizableCell();
					else
						this._currentCell = hCellIndex;
                    if (hCellIndex != this._currentCell) {
                        hCellIndex = cellIndex = this._currentCell;
                        targetCell = e.target.previousSibling;
                    }
                    var currentTh = headerCells.filter(":visible")[cellIndex], changesCellIndex = [], changesFinalWdith = [], changesOldWidth = [];
                    indent = this.gridInstance.model.groupSettings.groupedColumns.length;
                    if (!ej.isNullOrUndefined(this.gridInstance.model.detailsTemplate) || !ej.isNullOrUndefined(this.gridInstance.model.childGrid))
                        indent += 1;
                    if ($(targetCell).parent("tr").hasClass('e-stackedHeaderRow')) {
                        currentSpan = $(currentTh).attr('colspan'), tr = $(currentTh).parent('tr'), tHeadIndex = currentTh.cellIndex;
                        var nextTr = tr.next();
                        while (tHeadIndex > indent) {
                            tHeadIndex--
                            var th = $(tr).children('th')[tHeadIndex];
                            preCol += parseInt($(th).attr('colspan'))
                        };
                        var length = preCol + parseInt(currentSpan);
                    }
                    else {

                        preCol = cellIndex; length = cellIndex + 1;
                    }
                    var finalWidth = 0, headerWidth = 0, contentWidth = 0, argCols = [], argExtra = [];
                    if (preCol != -1) {
                        var hiddenLen = headerCells.slice(0, preCol + 1).filter(".e-hide").length;
                        var args = { columnIndex: preCol + hiddenLen, column: this.gridInstance.model.columns[preCol + hiddenLen], target: $target, oldWidth: oldWidth };
                        this.gridInstance._trigger("resizeStart", args);
                        for (var i = preCol; i < length; i++) {
                            hiddenLen = headerCells.slice(0, i + 1).filter(".e-hide").length;
                            contentWidth = this._getContentWidth(i + hiddenLen);
                            $cellDiv = this.gridInstance.getHeaderTable().find('.e-headercell:not(.e-hide, .e-stackedHeaderCell)').children(".e-headercelldiv").eq(i);
                            headerWidth = this._getHeaderContentWidth($cellDiv);
                            finalWidth = headerWidth > contentWidth ? headerWidth : contentWidth;
                            finalWidth += parseInt($cellDiv.css("padding-left"), 10);
                            var oldWidth = this.gridInstance.getHeaderTable().find('col').filter(this._diaplayFinder).eq(i + indent).width();
                            finalWidth = oldWidth > finalWidth ? finalWidth : (this._colMinWidth < finalWidth ? finalWidth : this._colMinWidth);

                            var headerCols = this.gridInstance.getHeaderTable().find('col').filter(this._diaplayFinder);
                            if(this.gridInstance.model.detailsTemplate || this.gridInstance.model.childGrid)
                                headerCols.splice(0, 1);
                            headerCols.eq(i + indent).width(finalWidth);
                            if (this.gridInstance.model.groupSettings.groupedColumns.length) {
                                var $colGroups = this.gridInstance.getContentTable().find('.e-recordtable').find('colgroup');
                                var proxy = this;
                                $.each($colGroups, function (indx, colgroup) {
                                    $(colgroup).find('col').filter(proxy._diaplayFinder).eq(i).width(finalWidth);
                                });
                            }
                            var contentCols = this.gridInstance.getContentTable().find('col').filter(this._diaplayFinder);
                            if(this.gridInstance.model.detailsTemplate || this.gridInstance.model.childGrid)
                                contentCols.splice(0, 1);
                            contentCols.eq(i + indent).width(finalWidth);
                            if (this.gridInstance.model.isEdit) {
                                var $editableCol = this.gridInstance.getContentTable().find(".e-editedrow").find("col");
                                $editableCol.eq(i + indent).width(finalWidth);
                            }
                            argCols.push(this.gridInstance.model.columns[i + hiddenLen]);
                            argExtra.push(Math.abs(finalWidth - oldWidth))
                            changesCellIndex.push(i + hiddenLen); changesFinalWdith.push(finalWidth); changesOldWidth.push(oldWidth);
                            if (this.gridInstance.model.scrollSettings.frozenColumns > 0 || (this.gridInstance.model.groupSettings.groupedColumns.length && this.gridInstance.model.isEdit)) {
                                var colIndex = i + hiddenLen;
                                this.gridInstance.columnsWidthCollection[colIndex] = finalWidth;
                                this.gridInstance.setWidthToColumns();
                                if (this.gridInstance.model.scrollSettings.frozenColumns <= colIndex + 1) {
                                    this.gridInstance.getHeaderContent().find(".e-movableheader").css("margin-left", finalWidth);
                                    this.gridInstance.getContent().find(".e-movablecontent").css("margin-left", finalWidth);
                                }
                            }
                        }

                    }
                    this.gridInstance._colgroupRefresh();
                    this.gridInstance._recalculateIndentWidth();
                    args = { columnIndex: changesCellIndex, column: argCols, target: currentTh, oldWidth: changesOldWidth, newWidth: changesFinalWdith, extra: argExtra };
                    this.gridInstance._trigger("resizeEnd", args);
                    for (var i = 0; i < changesCellIndex.length; i++) {
                        this.gridInstance.columnsWidthCollection[changesCellIndex[i]] = changesFinalWdith[i];
                        this.gridInstance.model.columns[changesCellIndex[i]]["width"] = changesFinalWdith[i];
                    }
                    args = { columnIndex: changesCellIndex, column: argCols, target: currentTh, oldWidth: changesOldWidth, newWidth: changesFinalWdith, extra: argExtra };
                    this.gridInstance._trigger("resized", args);
                    if (this.gridInstance.model.summaryRows.length > 0)
                        this.gridInstance._summaryColRrefresh();
					this.gridInstance._findColumnsWidth();
                }				
            }
        },
        _getContentWidth: function (cellindx) {
            var contentWidth = 0;
            var $span = ej.buildTag('span', {}, {}), proxy = this.gridInstance, tdWidth;
            if (!ej.isNullOrUndefined(proxy._gridRows)) {
                var rows = proxy._gridRows;
                if (this.gridInstance.model.scrollSettings.frozenColumns && cellindx >= this.gridInstance.model.scrollSettings.frozenColumns) {
                    rows = rows[1];
                    cellindx = cellindx - this.gridInstance.model.scrollSettings.frozenColumns;
                }
                $.each(rows, function (indx, row) {
                    if ($(row).is('.e-row,.e-alt_row') && !$(row).is('.e-editedrow')) {
					    var td = $(row).find('td.e-rowcell').eq(cellindx);
					    var content = $(td).html();
					    if (proxy.model.columns[cellindx]["commands"])
					        $span.html($(content).children());
					    else if (td.hasClass("e-validError"))
					        $span.html($(content).attr("value"));
					    else
						    $span.html(content);
					    $(td).html($span);
					    tdWidth = td.find('span:first').width();
					    if (tdWidth > contentWidth)
						    contentWidth = tdWidth;
					    $(td).html(content);
                    }
				});
			}
            proxy._refreshUnboundTemplate(this.gridInstance.getContentTable());
            return contentWidth;
        },
        _getHeaderContentWidth: function ($cellDiv) {
            var headerWidth = 0, $span = ej.buildTag('span', {}, {});
            var content = $cellDiv.html();
            $span.html(content);
            $cellDiv.html($span);
            headerWidth = $cellDiv.find('span:first').width();
            if (this.gridInstance.model.allowFiltering && this.gridInstance.model.filterSettings.filterType == "menu" || this.gridInstance.model.filterSettings.filterType == "excel")
                headerWidth = headerWidth + $cellDiv.parent().find(".e-filtericon").width() + 10;
            $cellDiv.html(content);
            return headerWidth;
        },
    };
})(jQuery, Syncfusion);;

});