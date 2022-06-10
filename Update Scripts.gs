//All scrips to do with requesting project updates, including HTML interface and database(s) interactions

function requestUpdate(sylCode){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Validation");
  let updateTypeData = sheet.getRange("D2:D").getValues();
  let updateTypes = flattenData(updateTypeData);

  let teamsData = sheet.getRange("C2:C").getValues();
  let teams = flattenData(teamsData);

  let sizeData = sheet.getRange("E2:E").getValues();
  let size = flattenData(sizeData);

  let urgencyData = sheet.getRange("F2:F").getValues();
  let urgency = flattenData(urgencyData)

  let html = HtmlService.createTemplateFromFile("Update Request");
  html.updateList = updateTypes;
  html.teamList = teams;
  html.sylCode = sylCode;
  html.size = size;
  html.urgency = urgency;

  let htmlWindow = HtmlService.createHtmlOutput(html.evaluate()).setWidth(400).setHeight(450);
  SpreadsheetApp.getUi().showModalDialog(htmlWindow,"Update Assistant");
}

function logUpdate(sylCode,updateType,updateDescription,updateTeam,updateUrgency,updateSize){
  const database = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Update DB");
  const uniqueId = Utilities.getUuid();
  const user = Session.getActiveUser().getEmail();
  const updateValues = [uniqueId,sylCode,updateType,user,updateDescription,updateTeam,updateSize,updateUrgency,"","Open"];
  database.appendRow(updateValues);
  //Update project DB with reference
  const projectDB = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Project DB");
  const dbValues = projectDB.getRange(globalValues.rowOffset,globalValues.sylCodeColumn,projectDB.getLastRow()-globalValues.rowOffset,6).getValues();
  for(let i=0;i<dbValues.length;i++){
    if(dbValues[i][0]===sylCode){
      //Update activity
      const activeUpdates = projectDB.getRange(i+globalValues.rowOffset,globalValues.activeUpdatesColumn);
      const activeUpdatesValue = activeUpdates.getValue();
      if(activeUpdatesValue===""){
        activeUpdates.setValue(uniqueId)
      }else{
        let splitUpdates = activeUpdatesValue.split(",");
        splitUpdates.push(uniqueId);
        activeUpdates.setValue(splitUpdates.join(","));
      }

      break;
    }
  }
}

function completeUpdate(sylCode,updateId){
  const projectDB = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Project DB");
  const dbValues = projectDB.getRange(globalValues.rowOffset,globalValues.sylCodeColumn,projectDB.getLastRow()-globalValues.rowOffset,6).getValues();
  for(let i=0;i<dbValues.length;i++){
    if(dbValues[i][0]===sylCode){
      //Update activity
      const activeUpdates = projectDB.getRange(i+globalValues.rowOffset,globalValues.activeUpdatesColumn);
      const pastUpdates = projectDB.getRange(i+globalValues.rowOffset,globalValues.pastUpdatesColumn);

      const activeUpdatesValue = activeUpdates.getValue();
      const pastUpdatesValue = pastUpdates.getValue();

      const splitValues = activeUpdatesValue.split(",");
      const updateIndex = splitValues.indexOf(updateId);

      if(updateIndex>-1){
        //Remove value from the active updates
        splitValues.splice(updateIndex,1);
        activeUpdates.setValue(splitValues.join(","));
        //Add value to the past updates
        if(pastUpdatesValue===""){
          pastUpdates.setValue(updateId);
        }else{
          let splitPastUpdates = pastUpdatesValue.split(",");
          splitPastUpdates.push(updateId);
          pastUpdates.setValue(splitPastUpdates.join(","));
        }
      }

      break;
    }
  }
}

function closeUpdate(updateId){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Update DB");
  const values = sheet.getRange(2,1,sheet.getLastRow()-2,1).getValues();
  const user = Session.getActiveUser().getEmail();
  const today = new Date();
  for(let i=0;i<values.length;i++){
    if(values[i][0]===updateId){
      sheet.getRange(i+2,10,1,3).setValues([["Closed",user,today]]);
      break;
    }
  }
}

