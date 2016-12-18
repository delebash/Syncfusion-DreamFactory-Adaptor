/*!
*  filename: ej.radialmenu.js
*  version : 14.2.0.26
*  Copyright Syncfusion Inc. 2001 - 2016. All rights reserved.
*  Use of this code is subject to the terms of our license.
*  A copy of the current license can be obtained at any time by e-mailing
*  licensing@syncfusion.com. Any infringement will be prosecuted under
*  applicable laws. 
*/
(function (fn) {
    typeof define === 'function' && define.amd ? define(["./../common/ej.core"], fn) : fn();
})
(function () {
	
/**
* @fileOverview Plugin to style the Html Radial Menu elements
* @copyright Copyright Syncfusion Inc. 2001 - 2016. All rights reserved.
*  Use of this code is subject to the terms of our license.
*  A copy of the current license can be obtained at any time by e-mailing
*  licensing@syncfusion.com. Any infringement will be prosecuted under
*  applicable laws. 
* @version 12.1 
* @author <a href="mailto:licensing@syncfusion.com">Syncfusion Inc</a>
*/

(function ($, ej, undefined) {

    ej.widget("ejRadialMenuBase", "ej.RadialMenuBase", {
        _tags: [{
            tag: "items",
            attr: ["imageName", "imagePath", "imageUrl", "windows.text", "flat.text", "text", "click", "touch", "enabled",
                "badge.enabled", "badge.value", "type", "sliderSettings.ticks", "sliderSettings.strokeWidth", "sliderSettings.labelSpace", [{
                    tag: "items", attr: ["imageName", "imagePath", "imageUrl", "windows.text", "flat.text", "text", "click",
                     "touch", "enabled"]
                }]]
        }],
        defaults: {
            radius: 150,
            cssClass: "",
            enableAnimation: true,
            open: null,
            close: null,
            items: []
        },
        dataTypes: {
            radius: "number",
            enableAnimation: "boolean",
            items: "array"
        },
        _initialization: function () {
            this.element.addClass(this.model.cssClass);
            this._svgLink = "http://www.w3.org/2000/svg";
            if (this.model.items.length < 1) {
                this._radialItems = $(this.element.find(">ul").children());
                for (var i = 0; i < this._radialItems.length ; i++) {
                    this.model.items.push(this._itemsObjectCollection($(this._radialItems[i])));
                    if ($(this._radialItems[i]).find("ul").children().length > 0) {
                        this._nestedRadialItems = $(this._radialItems[i]).find("ul").children();
                        this.model.items[i].items = [];
                        for (var j = 0; j < this._nestedRadialItems.length; j++) {
                            this.model.items[i].items.push(this._itemsObjectCollection($(this._nestedRadialItems[j])));
                        }
                    }
                }
            }
            this._itemCount = this.model.items.length;
            $(this.element.children()).remove();
            this._startXY = this.model.radius;
            this._diameter = 2 * this.model.radius;
        },
        _itemsObjectCollection: function (element) {
            var item = {}, innerItem = {};
            $(this._tags[0].attr).each(function (i, e) {
                if (typeof (e) == "string") {
                    var attr = e.split('.');
                    if (attr.length == 1)
                        item[e] = element.attr("data-ej-" + e);
                    else {
                        var prop1 = attr[0], prop2 = attr[1];
                        if (!item[prop1])
                            innerItem = {};
                        innerItem[prop2] = element.attr("data-ej-" + e.replace(".", "-"));
                        item[prop1] = innerItem;
                    }
                }
            });
            return item;
        },
        _createSVGElement: function () {
            var svgObj = document.createElementNS(this._svgLink, 'svg');
            if (this.model.radius != null) {
                svgObj.setAttribute("width", this._diameter);
                svgObj.setAttribute("height", this._diameter);
            }
            return $(svgObj);
        },
        _createGroupElement: function (id) {
            var group = document.createElementNS(this._svgLink, "g");
            if (id)
                group.setAttribute("id", id);
            return $(group);
        },
        _createImageElement: function (width, height, currentEle, x, y) {
            imgLoc = currentEle["imageUrl"] ? currentEle["imageUrl"] : (this.model.renderMode.toLowerCase() != "flat" ? currentEle["imagePath"] + "/"
                + this.model.renderMode.toLowerCase() + "/" + currentEle["imageName"] : currentEle["imagePath"] + "/" + this.model.renderMode.toLowerCase() + "/" + currentEle["imageName"]),
            image = document.createElementNS(this._svgLink, "image");
            image.setAttribute("width", width);
            image.setAttribute("height", height);
            image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imgLoc);
            image.setAttribute("x", x);
            image.setAttribute("y", y);
            return image;
        },
        _createTextElement: function (x, y, style, content) {
            var text = document.createElementNS(this._svgLink, "text");
            text.setAttribute("x", x);
            text.setAttribute("y", y);
            text.setAttribute("class", style);
            text.textContent = content;
            return text;
        },
        _createPathElement: function (index, direction, style) {
            var path = document.createElementNS(this._svgLink, "path");
            path.setAttribute("index", index);
            path.setAttribute("d", direction);
            path.setAttribute("class", style);
            return path;
        },
        _createPolygonElement: function (index, transform) {
            var polygon = document.createElementNS(this._svgLink, "polygon");
            polygon.setAttribute("points", "10,10 0,10 5,5");
            polygon.setAttribute("index", index);
            polygon.setAttribute("fill", "#FFFFFF");
            polygon.setAttribute("transform", transform);
            return polygon;
        },
        _createCircleElement: function (x, y, r, style) {
            var circle = document.createElementNS(this._svgLink, "circle");
            circle.setAttribute("cx", x);
            circle.setAttribute("cy", y);
            circle.setAttribute("r", r);
            circle.setAttribute("class", style);
            return circle;
        },
        _calculateRadialArc: function (menuCount, size, mRadius, Arcdradius, polyRadius) {
            var itemCurrentPos = 0,
                startAngle = 2 * Math.PI * itemCurrentPos,
                endAngle = 2 * Math.PI * (itemCurrentPos + (10 / (menuCount * 10))),
                radius = 0.5 * size * Math.min(this._diameter, this._diameter),
                menuItemRadius = mRadius * size * Math.min(this._diameter, this._diameter),
                dradius = Arcdradius * radius,
                polygonRadius = polyRadius * radius,
                degPoint = 360 / menuCount,
                degree = degPoint / 2;
            var x1 = [], y1 = [], x2 = [], y2 = [], midx = [], midy = [], dStartX = [], dStartY = [], dEndX = [], dEndY = [], dmidx = [], dmidy = [], deg = [], longArc = [];
            for (var i = 0; i < menuCount; i++) {
                var pathStartAngle = -.5 * Math.PI;
                startAngle = startAngle + pathStartAngle;
                endAngle = endAngle + pathStartAngle - 0.000001;
                longArc[i] = endAngle - startAngle < Math.PI ? 0 : 1;
                var midAngle = (startAngle + endAngle) / 2;
                x1[i] = this._startXY + radius * Math.cos(startAngle);
                y1[i] = this._startXY + radius * Math.sin(startAngle);
                x2[i] = this._startXY + radius * Math.cos(endAngle);
                y2[i] = this._startXY + radius * Math.sin(endAngle);
                midx[i] = this._startXY + menuItemRadius * Math.cos(midAngle);
                midy[i] = this._startXY + menuItemRadius * Math.sin(midAngle);
                dStartX[i] = this._startXY + dradius * Math.cos(startAngle);
                dStartY[i] = this._startXY + dradius * Math.sin(startAngle);
                dEndX[i] = this._startXY + dradius * Math.cos(endAngle);
                dEndY[i] = this._startXY + dradius * Math.sin(endAngle);
                dmidx[i] = this._startXY + polygonRadius * Math.cos(midAngle);
                dmidy[i] = this._startXY + polygonRadius * Math.sin(midAngle);
                deg[i] = degree;
                itemCurrentPos += 10 / (menuCount * 10);
                startAngle = 2 * Math.PI * itemCurrentPos;
                endAngle = 2 * Math.PI * (itemCurrentPos + (10 / (menuCount * 10)));
                degree += degPoint;
            }
            return ({
                x1: x1, y1: y1, x2: x2, y2: y2, midx: midx, midy: midy, dStartX: dStartX, dStartY: dStartY, dEndX: dEndX, dEndY: dEndY, dmidx: dmidx,
                dmidy: dmidy, deg: deg, longArc: longArc, radius: radius, dradius: dradius
            });
        },
        _renderRadialMenu: function () {
            this._radialSVG = this._createSVGElement();
            this._radialChildSVG = this._createSVGElement();
            this._childArcGroup = this._createGroupElement("childarcgroup");
            this._polygonGroup = this._createGroupElement("polygongroup");
            this._polygonGroup.attr("transform", "translate(-10,-10)");
            this._radialArcGroup = this._createGroupElement("outerarcpathgroup");
            this._menuItemsArcGroup = this._createGroupElement("arcpathgroup");
            this._menuItemsGroup = this._createGroupElement("menuitemsgroup");
            this._menuItemsGroup.attr("transform", "translate(-10,-5)");
            this._menuItemsArcPaths = this._createGroupElement("menuitemsarcpaths");
            this._menuItemsPaths = this._createGroupElement("itemspathgroup");
            this._radialSVGDiv = ej.buildTag("div#" + this._id + "_svgdiv." + this._prefix + "abs").css("height", this._diameter);
            this._radialCircleSVGDiv = ej.buildTag("div#" + this._id + "_circlesvgdiv." + this._prefix + "abs " + this._prefix + "displaynone");
            this._radialChildSVGDiv = ej.buildTag("div#" + this._id + "_childsvgdiv." + this._prefix + "abs " + this._prefix + "displaynone");
            var pointsVal = this._calculateRadialArc(this._itemCount, 1, 0.28, 0.8, 0.95),
                pointsArcVal = this._calculateRadialArc(this._itemCount, 0.79, null, 0.97, null),
                pointsItemVal = this._calculateRadialArc(this._itemCount, 0.8, null, 0.3, null),
                pointsOuterArcVal = this._calculateRadialArc(1, 1, 0.28, 0.8, null),
                outerArcDirection = this._pathDirection(pointsOuterArcVal.x1[0], pointsOuterArcVal.y1[0], pointsOuterArcVal.radius, pointsOuterArcVal.longArc[0], pointsOuterArcVal.x2[0], pointsOuterArcVal.y2[0],
                                    pointsOuterArcVal.dEndX[0], pointsOuterArcVal.dEndY[0], pointsOuterArcVal.dradius, pointsOuterArcVal.dStartX[0], pointsOuterArcVal.dStartY[0]),
                imgDim = 20;
            for (var i = 0; i < this._itemCount; i++) {
                var direction = this._pathDirection(pointsVal.x1[i], pointsVal.y1[i], pointsVal.radius, pointsVal.longArc[i], pointsVal.x2[i], pointsVal.y2[i],
                    pointsVal.dEndX[i], pointsVal.dEndY[i], pointsVal.dradius, pointsVal.dStartX[i], pointsVal.dStartY[i]),
                    arcDirection = this._pathDirection(pointsArcVal.x1[i], pointsArcVal.y1[i], pointsArcVal.radius, pointsArcVal.longArc[i], pointsArcVal.x2[i],
                    pointsArcVal.y2[i], pointsArcVal.dEndX[i], pointsArcVal.dEndY[i], pointsArcVal.dradius, pointsArcVal.dStartX[i], pointsArcVal.dStartY[i]),
                    itemDirection = this._pathDirection(pointsItemVal.x1[i], pointsItemVal.y1[i], pointsItemVal.radius, pointsItemVal.longArc[i], pointsItemVal.x2[i],
                    pointsItemVal.y2[i], pointsItemVal.dEndX[i], pointsItemVal.dEndY[i], pointsItemVal.dradius, pointsItemVal.dStartX[i], pointsItemVal.dStartY[i]),
                    currentEle = this.model.items[i],
                    imgTextGroup = this._createGroupElement(),
                    itemEnable = this._enableItem(currentEle, imgTextGroup);
                this._menuItemsArcPaths.append(this._createPathElement(i, arcDirection, "" + this._prefix + "arcbgcolor"));
                this._menuItemsPaths.append(this._createPathElement(i, itemDirection, itemEnable.itemPathClass));
                this._menuItemsArcGroup.append(this._createPathElement(i, direction, itemEnable.arcPathClass));
                imgTextGroup.attr({ "cursor": "context-menu", "index": i });
                imgTextGroup.append(this._createImageElement(imgDim, imgDim, currentEle, pointsVal.midx[i], pointsVal.midy[i] - imgDim / 2));
                imgTextGroup.append(this._createTextElement(pointsVal.midx[i] + 10, pointsVal.midy[i] + 25, itemEnable.textClass, itemEnable.dataText));
                if (currentEle.badge && (currentEle.badge.enabled == "true" || currentEle.badge.enabled == true))
                    imgTextGroup.append(this._createCircleElement(pointsVal.midx[i] + 25, pointsVal.midy[i] - 10, 10, "" + this._prefix + "badgecircle"))
                                .append(this._createTextElement(pointsVal.midx[i] + 25, pointsVal.midy[i] - 7, "" + this._prefix + "badgetext", currentEle.badge.value));
                this._menuItemsGroup.append(imgTextGroup);
                if (currentEle["items"] || (currentEle.type && currentEle.type.toLowerCase() == (this.model.renderMode ? ej.mobile : ej).RadialMenu.ItemType.Slider)) {
                    var transform = pointsVal.deg[i] > 270 ? "translate(" + (pointsVal.dmidx[i] + 5) + "," + (pointsVal.dmidy[i] + 15) + ")" + "rotate(" + pointsVal.deg[i] + ")"
                        : "translate(" + (pointsVal.dmidx[i] + 10) + "," + (pointsVal.dmidy[i] + 10) + ")" + "rotate(" + pointsVal.deg[i] + ")";
                    this._childArcGroup.append(this._createPathElement(i, direction, "" + this._prefix + "childdefault"));
                    this._polygonGroup.append(this._createPolygonElement(i, transform));
                }
            }
            var circle = this._createCircleElement(this._startXY, this._startXY, this._startXY / 3.5, "" + this._prefix + "circlebgcolor");
            this._radialArcGroup.append(this._createPathElement(1, outerArcDirection, "" + this._prefix + "outerdefault"));
            this._radialChildSVG.append(this._menuItemsPaths).append(this._menuItemsArcGroup).append(this._childArcGroup)
                                .append(this._polygonGroup).append(this._menuItemsArcPaths).append(this._menuItemsGroup).append(circle);
            this._radialContainer.append(this._radialSVGDiv.append(this._radialCircleSVGDiv.append(this._radialSVG.append(this._radialArcGroup)))
                                 .append(this._radialChildSVGDiv.append(this._radialChildSVG)));
        },
        _ejMenuBaseItemsRemove: function () {
            this._menuChildSVGDiv = ej.buildTag("div#" + this._id + "_menuchildsvgdiv." + this._prefix + "abs");
            if (this.model.enableAnimation) {
                this._radialChildSVGDiv.removeClass("" + this._prefix + "radialshow").addClass("" + this._prefix + "scalehide");
                this._radialChildAnimate();
                this._menuChildSVGDiv.addClass("" + this._prefix + "scaleshow");
            }
            else
                this._radialChildSVGDiv.addClass("" + this._prefix + "displaynone");
            this._radial.removeClass(this.model.imageClass).addClass("" + this._prefix + "backarrow " + this.model.backImageClass + "");
        },
        _renderRadialChildMenu: function (currentItem) {
            this._menuChildSVG = this._createSVGElement();
            this._childItemsGroup = this._createGroupElement("childitemsgroup");
            this._childItemsGroup.attr("transform", "translate(-10,-10)");
            this._childItemArcGroup = this._createGroupElement();
            this._childItemsArcPaths = this._createGroupElement("childitemsarcpaths");
            this._childItemsPaths = this._createGroupElement();
            var childCount = currentItem.items.length,
                pointsVal = this._calculateRadialArc(childCount, 1, 0.28, 0.8, null),
                pointsArcVal = this._calculateRadialArc(childCount, 0.79, null, 0.97, null),
                pointsItemVal = this._calculateRadialArc(childCount, 0.8, null, 0.3, null),
                imgDim = 20;
            for (var i = 0; i < childCount; i++) {
                var direction = this._pathDirection(pointsVal.x1[i], pointsVal.y1[i], pointsVal.radius, pointsVal.longArc[i], pointsVal.x2[i], pointsVal.y2[i],
                    pointsVal.dEndX[i], pointsVal.dEndY[i], pointsVal.dradius, pointsVal.dStartX[i], pointsVal.dStartY[i]),
                    arcDirection = this._pathDirection(pointsArcVal.x1[i], pointsArcVal.y1[i], pointsArcVal.radius, pointsArcVal.longArc[i], pointsArcVal.x2[i],
                    pointsArcVal.y2[i], pointsArcVal.dEndX[i], pointsArcVal.dEndY[i], pointsArcVal.dradius, pointsArcVal.dStartX[i], pointsArcVal.dStartY[i]),
                    itemDirection = this._pathDirection(pointsItemVal.x1[i], pointsItemVal.y1[i], pointsItemVal.radius, pointsItemVal.longArc[i], pointsItemVal.x2[i],
                    pointsItemVal.y2[i], pointsItemVal.dEndX[i], pointsItemVal.dEndY[i], pointsItemVal.dradius, pointsItemVal.dStartX[i], pointsItemVal.dStartY[i]),
                    imgTextGroup = this._createGroupElement(),
                    currentEle = currentItem.items[i],
                    itemEnable = this._enableItem(currentEle, imgTextGroup);
                this._childItemArcGroup.append(this._createPathElement(i, direction, itemEnable.arcPathClass));
                this._childItemsArcPaths.append(this._createPathElement(i, arcDirection, "" + this._prefix + "arcbgcolor"));
                this._childItemsPaths.append(this._createPathElement(i, itemDirection, itemEnable.itemPathClass));
                imgTextGroup.attr({ "cursor": "context-menu", "index": i });
                imgTextGroup.append(this._createImageElement(imgDim, imgDim, currentEle, pointsVal.midx[i], pointsVal.midy[i] - imgDim / 2));
                imgTextGroup.append(this._createTextElement(pointsVal.midx[i] + 10, pointsVal.midy[i] + 25, itemEnable.textClass, itemEnable.dataText));
                this._childItemsGroup.append(imgTextGroup);
            }
            var circle = this._createCircleElement(this._startXY, this._startXY, this._startXY / 3.5, "" + this._prefix + "circlebgcolor");
            this._radialSVGDiv.append(this._menuChildSVGDiv.append(this._menuChildSVG.append(this._childItemsPaths)
                              .append(this._childItemArcGroup).append(this._childItemsArcPaths).append(this._childItemsGroup).append(circle)));
        },
        _radialSliderHandler: function (e) {
            this.updateBadgeValue(this._index, e.value);
            this._data = { value: e.value, oldValue: e.oldValue, index: this._index };
            this._eventsTrigger(this._data, this.model.renderMode ? "touch" : "click");
        },
        _isRSText: function (eleClass) {
            return ((eleClass == this._prefix + "ticks-text" || eleClass == this._prefix + "dynamic-text") ? true : false);
        },
        _pathDirection: function (x1, y1, radius, lArc, x2, y2, dEndX, dEndY, dRadius, dStartX, dStartY) {
            return "M" + " " + x1 + " " + y1 + " " + "A" + " " + radius + " " + radius + " " + "0" + " " + lArc + " " + "1" + " " + x2 + " " + y2 + " " + "L" +
                " " + dEndX + " " + dEndY + " " + "A" + " " + dRadius + " " + dRadius + " " + "1" + " " + lArc + " " + "0" + " " + dStartX + " " + dStartY + " " + "z";
        },
        _enableItem: function (currentObj, ele) {
            var itemPathClass = this._prefix + "itembgcolor", arcPathClass = this._prefix + "default", textClass = "" + this._prefix + "textcolor",
                dataText = this.model.renderMode ? currentObj[this.model.renderMode].text : currentObj.text;
            if (currentObj.enabled == "false" || currentObj.enabled == false) {
                ele.attr("class", this._prefix + "itemdisabled");
                return {
                    itemPathClass: this._prefix + "itembgcolor " + this._prefix + "pathdisabled", arcPathClass: this._prefix + "default " + this._prefix + "pathdisabled",
                    dataText: dataText, textClass: textClass
                };
            }
            else
                return { itemPathClass: itemPathClass, arcPathClass: arcPathClass, dataText: dataText, textClass: textClass };
        },
        _windowsMenuShow: function () {
            if (this.model.enableAnimation) {
                this._radialCircleSVGDiv.removeClass(this._prefix + "displaynone " + this._prefix + "radialhide").addClass(this._prefix + "radialshow");
                this._radialChildSVGDiv.removeClass(this._prefix + "displaynone " + this._prefix + "radialhide").addClass(this._prefix + "radialshow");
            }
            else {
                this._radialCircleSVGDiv.removeClass(this._prefix + "displaynone");
                this._radialChildSVGDiv.removeClass(this._prefix + "displaynone");
            }
            this._openCloseTrigger("open");
        },
        _windowsMenuHide: function (proxy) {
            if (this.model.enableAnimation) {
                this._radialCircleSVGDiv.removeClass(this._prefix + "radialshow").addClass(this._prefix + "radialhide");
                this._radialChildSVGDiv.removeClass(this._prefix + "radialshow " + this._prefix + "scaleshow").addClass(this._prefix + "radialhide");
                setTimeout(function () {
                    proxy._radialCircleSVGDiv.addClass(proxy._prefix + "displaynone");
                    proxy._radialChildSVGDiv.addClass(proxy._prefix + "displaynone");
                }, 160);
            }
            else {
                this._radialCircleSVGDiv.addClass(this._prefix + "displaynone");
                this._radialChildSVGDiv.addClass(this._prefix + "displaynone");
            }
            this._openCloseTrigger("close");
        },
        _windowsInnerMenuHide: function (proxy) {
            this._radial.removeClass(this._prefix + "backarrow " + this.model.backImageClass + "").addClass(this.model.imageClass);
            if (this.model.enableAnimation) {
                this._menuChildSVGDiv.removeClass(this._prefix + "scaleshow").addClass(this._prefix + "scalehide");
                setTimeout(function () { proxy._menuChildSVGDiv.remove(); }, 150);
                setTimeout(function () { proxy._radialChildSVGDiv.removeClass(proxy._prefix + "scalehide " + proxy._prefix + "displaynone").addClass(proxy._prefix + "scaleshow"); }, 200);
            }
            else {
                this._menuChildSVGDiv.remove();
                this._radialChildSVGDiv.removeClass(this._prefix + "displaynone");
            }
        },
        _eventsTrigger: function (data, eventName) {
            var event = this.model[eventName];
            this.model[eventName] = this._childTarget && this.model.items[data.index].items[data.childIndex][eventName] ? this.model.items[data.index].items[data.childIndex][eventName]
                : (!this._childTarget && this.model.items[data.index][eventName] ? this.model.items[data.index][eventName] : this.model[eventName]);
            if (this.model[eventName])
                this._trigger(eventName, data);
            this.model[eventName] = event;
        },
        _openCloseTrigger: function (eventName) {
            if (this.model[eventName])
                this._trigger(eventName);
        },
        _menuEnabledDisabled: function (itemIndices, menuClass) {
            var proxy = this,
                itemIndex;
            if ($.isArray(itemIndices)) {
                $.each(itemIndices, function (i, itemIndex) {
                    if (!$.isArray(itemIndex))
                        proxy._menuItems(proxy, itemIndex, menuClass);
                    else {
                        $.each(itemIndex, function (i, index) {
                            if (!$.isArray(index)) {
                                if (!proxy.model.renderMode || (proxy.model.renderMode && (proxy.model.renderMode == "windows" || proxy.model.renderMode == "flat")))
                                    proxy._menuItems(proxy, index, menuClass);
                                itemIndex = index;
                            }
                            else {
                                $.each(index, function (i, childIndex) {
                                    proxy.model.items[itemIndex].items[childIndex].enabled = (menuClass == "disabled") ? false : true;
                                });
                            }
                        });
                    }
                });
            }
        },
        _ejMenuItem: function (proxy, index, menuClass) {
            var currentGroupEle = $(this._menuItemsGroup.find("g")[index]),
                currentItemPathEle = $(this._menuItemsPaths.find("path")[index]),
                currentArcPathEle = $(this._radialChildSVGDiv.find("#arcpathgroup path")[index]);
            if (menuClass == "disabled") {
                currentItemPathEle.attr("class", "" + this._prefix + "itembgcolor " + this._prefix + "pathdisabled");
                currentArcPathEle.attr("class", "" + this._prefix + "default " + this._prefix + "pathdisabled");
                currentGroupEle.attr("class", "" + this._prefix + "itemdisabled");
				if(!ej.isNullOrUndefined(this._radialChildSVGDiv) && $(this._radialChildSVGDiv.find("#polygongroup polygon[index='"+index+"']")).length > 0) {
					$(this._radialChildSVGDiv.find("#polygongroup polygon[index='"+index+"']")).attr("class",this._prefix + "itemdisabled");
					$(this._radialChildSVGDiv.find("#childarcgroup path[index='"+index+"']")).attr("class",this._prefix + "itemdisabled");
				} 
            }
            else {
                currentItemPathEle.attr("class", "" + this._prefix + "itembgcolor");
                currentArcPathEle.attr("class", "" + this._prefix + "default");
                currentGroupEle.removeAttr("class");
				if(!ej.isNullOrUndefined(this._radialChildSVGDiv) && $(this._radialChildSVGDiv.find("#polygongroup polygon[index='"+index+"']")).length > 0){
					$(this._radialChildSVGDiv.find("#polygongroup polygon[index='"+index+"']")).removeAttr("class");
				}  $(this._radialChildSVGDiv.find("#childarcgroup path[index='"+index+"']")).attr("class",this._prefix + "childdefault");
            }
        },
        _ejMenuHide: function (proxy) {
            if (this.model.enableAnimation) {
                this._radialCircleSVGDiv.removeClass(this._prefix + "radialshow").addClass(this._prefix + "radialhide");
                this._radialChildSVGDiv.removeClass(this._prefix + "radialshow " + this._prefix + "scaleshow").addClass(this._prefix + "radialhide");
                setTimeout(function () {
                    proxy._radialCircleSVGDiv.addClass(proxy._prefix + "displaynone").removeClass(proxy._prefix + "radialshow " + proxy._prefix + "radialhide " + proxy._prefix + "scaleshow " + proxy._prefix + "scalehide");
                    proxy._radialChildSVGDiv.addClass(proxy._prefix + "displaynone").removeClass(proxy._prefix + "radialshow " + proxy._prefix + "radialhide " + proxy._prefix + "scaleshow " + proxy._prefix + "scalehide");
                }, 160);
            }
            else {
                this._radialCircleSVGDiv.addClass(this._prefix + "displaynone");
                this._radialChildSVGDiv.addClass(this._prefix + "displaynone");
            }
            this._openCloseTrigger("close");
        },
        _ejInnerMenuHide: function (proxy) {
            this._radial.removeClass(this._prefix + "backarrow " + this.model.backImageClass + "").addClass(this.model.imageClass);
            if (this.model.enableAnimation) {
                this._radialCircleSVGDiv.removeClass(this._prefix + "radialshow " + this._prefix + "radialhide " + this._prefix + "scaleshow " + this._prefix + "scalehide").addClass(this._prefix + "displaynone");
                this._radialChildSVGDiv.removeClass(this._prefix + "radialshow " + this._prefix + "radialhide " + this._prefix + "scaleshow " + this._prefix + "scalehide").addClass(this._prefix + "displaynone");
                this._menuChildSVGDiv.removeClass(this._prefix + "scaleshow").addClass(this._prefix + "radialhide");
                setTimeout(function () { proxy._menuChildSVGDiv.removeClass(proxy._prefix + "radialhide").remove(); }, 150);
            }
            else {
                this._radialCircleSVGDiv.addClass(this._prefix + "displaynone");
                this._radialChildSVGDiv.addClass(this._prefix + "displaynone");
                this._menuChildSVGDiv.remove();
            }
            this._openCloseTrigger("close");
        },
        _currentBadgeEle: function (index) {
            return this.model.renderMode == "android" ? $(this._imageBadgeGroup.find("g")[index]) : $(this._menuItemsGroup.find("g")[index]);
        },
        _badge: function (index) {
            return this._currentBadgeEle(index).find("." + this._prefix + "badgetext,." + this._prefix + "badgecircle");
        },
        show: function () {
            this.element.removeClass(this._prefix + "displaynone");
        },
        hide: function () {
            this.element.addClass(this._prefix + "displaynone");
        },
        showMenu: function () {
            this._showMenu();
        },
        hideMenu: function () {
            this._hideMenu();
        },
        enableItemByIndex: function (itemIndex) {
            this._menuItems(this, itemIndex, "enabled");
        },
        enableItemsByIndices: function (itemIndices) {
            this._menuEnabledDisabled(itemIndices, "enabled");
        },
        disableItemByIndex: function (itemIndex) {
            this._menuItems(this, itemIndex, "disabled");
        },
        disableItemsByIndices: function (itemIndices) {
            this._menuEnabledDisabled(itemIndices, "disabled");
        },
        updateBadgeValue: function (index, value) {
            this.model.items[index].badge.value = value;
            this._currentBadgeEle(index).children("text." + this._prefix + "badgetext").html(value);
        },
        showBadge: function (index) {
            this._badge(index).show();
        },
        hideBadge: function (index) {
            this._badge(index).hide();
        },
        _setModel: function (options) {
            this._refresh();
        },
        _refresh: function () {
            this._destroy();
            this._init();
        },
        _destroy: function () {
            ej.listenEvents([document, document], [ej.endEvent(), ej.startEvent()], [this._targetClick, this._targetDown], true);
            this.element.removeAttr("class style").children().remove();
        }
    });
})(jQuery, Syncfusion);;
/**
* @fileOverview Plugin to style the Html Radial Menu elements
* @copyright Copyright Syncfusion Inc. 2001 - 2016. All rights reserved.
*  Use of this code is subject to the terms of our license.
*  A copy of the current license can be obtained at any time by e-mailing
*  licensing@syncfusion.com. Any infringement will be prosecuted under
*  applicable laws. 
* @version 12.1 
* @author <a href="mailto:licensing@syncfusion.com">Syncfusion Inc</a>
*/
(function ($, ej, undefined) {

    ej.widget("ejRadialMenu", "ej.RadialMenu", {
        _rootCSS: "e-radialmenu",
        element: null,
        model: null,
        _setFirst: true,
        defaults: {
            imageClass: "e-radialimage",
            backImageClass: "e-backimage",
            targetElementId: null,
            click: null,
            //Deprecated property
            select: null,
            autoOpen: false,
            position: {
                x: null,
                y: null
            }
        },
        dataTypes: {
            autoOpen: "boolean"
        },
        _init: function () {
            this._id = this.element[0].id;
            if (!(ej.browserInfo().name == "msie" && ej.browserInfo().version < 9)) {
                this._initialization();
                this._prefix = "e-";
                this._renderRadial();
                this._wireEvents();
            }
        },
        _renderRadial: function () {
            this._radial = ej.buildTag("div.e-radial e-abs " + this.model.imageClass + "").css({ "left": this._startXY - 22 + "px", "top": this._startXY - 22 + "px" });
            this._radialContainer = ej.buildTag("div.e-rel").css({ "height": this._diameter, "width": this._diameter });
            this.element.append(this._radialContainer.append(this._radial)).addClass("e-radialmenu e-overlow e-user-select e-abs");
            this._radialInitialPosition();
            this._renderRadialMenu();
            var childArc = this._childArcGroup.children(),
                polygonGroup = this._polygonGroup.children();
            this._on(childArc, "mouseenter", this._arcOverHandler);
            this._on(childArc, "mouseleave", this._arcOverHandler);
            this._on(polygonGroup, "mouseenter", this._arcOverHandler);
            this._on(polygonGroup, "mouseleave", this._arcOverHandler);
            this._itemsEvents(this._menuItemsGroup.children(), this._menuItemsPaths.children(), this._menuItemsArcGroup.children());
        },
        _wireEvents: function () {
            var doc = $(document);
            this._radialClick = $.proxy(this._showMenu, this);
            this._targetDown = $.proxy(this._targetDownHandler, this);
            this._targetClick = $.proxy(this._targetClickHandler, this);
            this._itemClick = $.proxy(this._itemClickHandler, this);
            ej.listenEvents([this._radial, this._radialSVGDiv, doc, doc], [ej.endEvent(), ej.endEvent(), ej.endEvent(), ej.startEvent()],
                [this._radialClick, this._itemClick, this._targetClick, this._targetDown], false);
        },
        _itemsEvents: function (group, path, arcPath) {
            this._on(group, "mouseenter", this._itemOverHandler);
            this._on(group, "mouseleave", this._itemOverHandler);
            this._on(path, "mouseenter", this._itemOverHandler);
            this._on(path, "mouseleave", this._itemOverHandler);
            this._on(arcPath, "mouseenter", this._itemOverHandler);
            this._on(arcPath, "mouseleave", this._itemOverHandler);
        },
        _showMenu: function () {
            if (this._radial.hasClass("e-backarrow"))
                this._windowsInnerMenuHide(this);
            else {
                if (this._radialCircleSVGDiv.hasClass("e-displaynone"))
                    this._windowsMenuShow();
                else
                    this._windowsMenuHide(this);
            }
            this._childTarget = false;
        },
        _itemClickHandler: function (e) {
            var targetEle = $(e.target);
            if (targetEle.attr("class") == "e-active" || e.target.tagName == "polygon") {
                this._index = parseInt(targetEle.attr("index"));
                this._ejMenuBaseItemsRemove();
                var currentItem = this.model.items[this._index];
                if (currentItem.type && currentItem.type.toLowerCase() == ej.RadialMenu.ItemType.Slider) {
                    var ticks = currentItem.sliderSettings.ticks ? eval(currentItem.sliderSettings.ticks) : [8, 9, 11, 13, 16, 20, 26, 36, 72],
                        value = currentItem.badge.value ? parseInt(currentItem.badge.value) : 10,
                        stroke = currentItem.sliderSettings.strokeWidth ? parseInt(currentItem.sliderSettings.strokeWidth) : 1,
                        labelSpace = currentItem.sliderSettings.labelSpace ? parseInt(currentItem.sliderSettings.labelSpace) : 22;
                    this._menuChildSVGDiv.ejRadialSlider({
                        showInnerCircle: false, enableAnimation: false, radius: this.model.radius - 29, inline: true, strokeWidth: stroke,
                        labelSpace: labelSpace, value: value, ticks: ticks, change: $.proxy(this._radialSliderHandler, this)
                    });
                    this._radialSVGDiv.append(this._menuChildSVGDiv);
                }
                else {
                    this._renderRadialChildMenu(currentItem);
                    this._childTarget = true;
                    this._itemsEvents(this._childItemsGroup.children(), this._childItemsPaths.children(), this._childItemArcGroup.children());
                }
            }
            this._eventAction(e);
            if (this._event) {
                this._eventsTrigger(this._data, "click");
                this._eventsTrigger(this._data, "select");
            }
            this._event = false;
        },
        _eventAction: function (e) {
            var targetEle = $(e.target), eleClass = targetEle.attr("class"), tagName = e.target.tagName, index, text;
            if (eleClass == "e-itembgcolor" || eleClass == "e-default") {
                index = targetEle.index();
                text = !this._childTarget ? $(this._menuItemsGroup.children()[targetEle.index()]).text() : $(this._childItemsGroup.children()[targetEle.index()]).text();
                this._event = true;
                this._data = !this._childTarget ? { index: index, text: text } : { index: this._index, childIndex: index, text: text };
            }
            else if ((tagName == "text" && !this._isRSText(eleClass)) || tagName == "image") {
                index = targetEle.parent().index();
                text = targetEle.parent().text();
                this._event = true;
                this._data = !this._childTarget ? { index: index, text: text } : { index: this._index, childIndex: index, text: text };
            }
        },
        _radialInitialPosition: function () {
            this._targetElement = $("#" + this.model.targetElementId + "");
            if (this.model.autoOpen) {
                if (this.model.position.x != null && this.model.position.y != null)
                    this.element.css({ "top": this.model.position.y + "px", "left": this.model.position.x + "px" });
                else if (this.model.targetElementId)
                    this.element.css({ "top": this._targetElement.height() / 2 - this.model.radius + "px", "left": this._targetElement.width() / 2 - this.model.radius + "px" });
                this.show();
            }
            else
                this.hide();
        },
        _radialChildAnimate: function () {
            var proxy = this;
            setTimeout(function () {
                proxy._radialChildSVGDiv.removeClass("e-scalehide e-scaleshow").addClass("e-displaynone");
            }, 150);
        },
        _arcOverHandler: function (e) {
            var targetEle = $(e.target),
                index = parseInt(targetEle.attr("index")),
                targetGroupEle = $(this._childArcGroup.find('path[index=' + index + ']'));
            if (e.type == "mouseenter") {
                if (targetEle.attr("class") == "e-childdefault")
                    targetEle.attr("class", "e-active");
                else
                    targetGroupEle.attr("class", "e-active");
            }
            else {
                if (targetEle.attr("class") == "e-active")
                    targetEle.attr("class", "e-childdefault");
                else
                    targetGroupEle.attr("class", "e-childdefault");
            }
        },
        _itemOverHandler: function (e) {
            var index = $(e.currentTarget).index();
            var targetEle = !this._childTarget ? $(this._menuItemsArcPaths.children()[index]) : $(this._childItemsArcPaths.children()[index]);
            if (e.type == "mouseenter")
                targetEle.attr("class", "e-childdefault");
            else
                targetEle.attr("class", "e-arcbgcolor");
        },
        _targetDownHandler: function (e) {
            var targetEle = $(e.target);
            if (!targetEle.hasClass("e-rel") && $(targetEle.closest(".e-radialmenu")).length) {
                e.preventDefault();
            }
        },
        _targetClickHandler: function (e) {
            var targetEle = $(e.target), x = e.clientX, y = e.clientY, width, height,
                menuTarget = $(targetEle.closest(".e-radialmenu")).length,
                menuState = this._radialCircleSVGDiv.hasClass("e-displaynone");
            if (this.model.targetElementId) {
                width = this._targetElement.width();
                height = this._targetElement.height();
            }
            else {
                width = window.innerWidth;
                height = window.innerHeight;
            }
            if (menuTarget == 0 && $(targetEle.closest(this._targetElement)).length == 0 && this.model.targetElementId) {
                menuState ? this.hide() : this.hideMenu();
            }
            else if ($(targetEle.closest("div.e-radial")).length == 0 && menuState) {
                var left = x > width - this.model.radius ? width - this._diameter : (x > this.model.radius ? x - this.model.radius : 0),
                    top = y > height - this.model.radius ? height - this._diameter : (y > this.model.radius ? y - this.model.radius : 0);
                this.element.css({ "top": top + "px", "left": left + "px" });
            }
            else if (menuTarget == 0)
                this.hideMenu();
        },
        _menuItems: function (proxy, index, menuClass) {
            this._ejMenuItem(proxy, index, menuClass);
        },
        _hideMenu: function () {
            if (this._radial.hasClass("e-backarrow"))
                this._ejInnerMenuHide(this);
            else
                this._ejMenuHide(this);
        },
        setPosition: function (x, y) {
            this.element.css({ "top": y + "px", "left": x + "px" });
            this.show();
        },
        menuHide: function () {
            this._hideMenu();
        },
        enableItem: function (item) {
            this._ejMenuEnabledDisabled(item, "enabled");
        },
        disableItem: function (item) {
            this._ejMenuEnabledDisabled(item, "disabled");
        },
        enableItems: function (items) {
            this._ejMenuEnabledDisabled(items, "enabled");
        },
        disableItems: function (items) {
            this._ejMenuEnabledDisabled(items, "disabled");
        },
        _ejMenuEnabledDisabled: function (items, menuClass) {
            var proxy = this, ItemObj = $.isArray(items) ? items : $.makeArray(items);
            $.each(ItemObj, function (i, curItem) {
                $.each(proxy.model.items, function (j, baseItem) {
                    if (baseItem.text.toLowerCase() == curItem.toLowerCase())
                        proxy._menuItems(this, j, menuClass);
                    if (baseItem.items) {
                        $.each(baseItem.items, function (k, childItem) {
                            if (childItem.text.toLowerCase() == curItem.toLowerCase())
                                childItem.enabled = (menuClass == "disabled") ? false : true;
                        });
                    }
                });
            });
        }
    });
    ej.RadialMenu.ItemType = {
        Default: "default",
        Slider: "slider"
    };
    $.extend(true, ej.RadialMenu.prototype, ej.RadialMenuBase.prototype);
})(jQuery, Syncfusion);;

});