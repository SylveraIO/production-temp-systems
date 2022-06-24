function raiseFlag(sylCode){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Validation");
  let flagTypeData = sheet.getRange("I2:I").getValues();
  let flagTypeList = flattenData(flagTypeData);

  let flagCategoryData = sheet.getRange("B2:B").getValues();
  let flagCategories = flattenData(flagCategoryData);

  let html = HtmlService.createTemplateFromFile("Raise Flag");
  html.types = flagTypeList;
  html.categories = flagCategories;
  html.sylCode = sylCode;

  let htmlWindow = HtmlService.createHtmlOutput(html.evaluate()).setWidth(400).setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(htmlWindow,"Flag Assistant");
}

function logFlag(sylCode,type,category,description,tracking){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const db = ss.getSheetByName("Flag DB");
  const id = Utilities.getUuid();
  const today = new Date();
  const email = Session.getActiveUser().getEmail();
  db.appendRow([id,sylCode,today,email,type,category,description,tracking,"Open"])
}

function closeFlag(flagCode){;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dbSheet = ss.getSheetByName("Flag DB");
  const values = dbSheet.getRange(2,1,Math.max(1,dbSheet.getLastRow()-1),1).getValues();
  const email = Session.getActiveUser().getEmail();
  for(let i=0;i<values.length;i++){
    if(values[i][0]===flagCode){
      dbSheet.getRange(i+2,9,1,3).setValues([["Closed",email,new Date()]]);
      break;
    }
  }
}
