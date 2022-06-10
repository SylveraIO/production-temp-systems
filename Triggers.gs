/**
 * @OnlyCurrentDoc
 */

//Global variables
const stages = ["Pre-Production","Production Prep","Production Ready","Production","In App"];

function onOpen(){
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu("Pool Controls");
  const devMenu = ui.createMenu("Developer Actions")
  devMenu.addItem("Add developer information","developerButton");
  menu.addItem("Promote ⬆️","promoteButton");
  menu.addItem("Demote ⬇️","demoteButton");
  menu.addSeparator();
  menu.addItem("Block 🛑","blockButton");
  menu.addItem("Raise Flag 🚩","raiseFlagButton");
  menu.addItem("Unblock 🔑","unblockButton");
  menu.addSeparator();
  // menu.addItem("Raise error (NF) ⚠️","raiseErrorButton");
  // menu.addSeparator();
  menu.addItem("Request update 🆕","updateButton");
  menu.addItem("Complete update ✅","updateCompleteButton");
  menu.addSeparator();
  menu.addSubMenu(devMenu);
  menu.addToUi();
}

//Main function here is to prevent unathorised users to change values in the DB directly. It doesn't block the change, it just triggers a warning.
function onEdit(e){
  //If not an authorised user, it will alert when someone changes something in the database directly and not through the pool controls.
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  const oldValue = e.oldValue;
  const authorisedUsers = ["iggy@sylvera.io"];

  if(sheetName==="Project DB"){
    const user = Session.getUser().getEmail();
    if(!authorisedUsers.includes(user)){
      const ui = SpreadsheetApp.getUi();
      const title = "You are about to modify the database";
      const message = "You are trying to modify the database directly, instead of using Pool Controls. Please use the pool controls when possible. Do you want to proceed?";
      let response = ui.alert(title,message,ui.ButtonSet.YES_NO);
      if(response!==ui.Button.YES){
        range.setValue(oldValue);
      }
  }
}
}

//Function that searches for a certain code in the project DB and updates a given column with a given value
function updateDbSingleRange(code,column,value){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Project DB");
  const values = sheet.getRange(globalValues.rowOffset,globalValues.sylCodeColumn,sheet.getLastRow()-globalValues.rowOffset+1,1).getValues();
  for(let i=0;i<values.length;i++){
    if(values[i][0]===code){
      sheet.getRange(i+globalValues.rowOffset,column).setValue(value)
      break;
    }
  }
}



