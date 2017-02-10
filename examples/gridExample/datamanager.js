function makeCall(url, serviceObject, overrideMethod, APP_API_KEY) {
  let token = getToken('token');
  url += serviceObject;
  let dataManager = ej.DataManager({
    url: url,
    adaptor: new syncfusionDreamFactoryAdapter(),
    headers: [{"X-DreamFactory-API-Key": APP_API_KEY, "X-DreamFactory-Session-Token": token}]
  });


    $("#Grid").ejGrid({
        dataSource: dataManager,
        toolbarSettings: {
            showToolbar: true,
            toolbarItems: ["add", "edit", "delete"]
        },
        editSettings: {
            allowEditing: true,
            allowAdding: true,
            allowDeleting: true,
            editMode: "dialog"
        },
        allowPaging: true,
        allowSorting: true,
        allowFiltering: true,
        filterSettings: {showPredicate: true, filterType: "menu", enableCaseSensitivity: true},
        searchSettings: {ignoreCase: false},
        isResponsive: true,
        columns: [
            {field: "id", isPrimaryKey: true, isIdentity: true, width: 10},
            {field: "first_name", headerText: "First Name", width: 110},
            {field: "last_name", headerText: "Last Name", width: 110}
        ]
    });
}