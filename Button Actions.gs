//PROMOTING IN VANILLA WORKFLOW
function promoteButton(){
  
  const promoteEnabled = ["Pre-Production","Production Prep","Production Ready","Production"];
  const sylveraCode = getSylveraCode(promoteEnabled,"promote","promoted",true)
  if(sylveraCode!==null){
    promoteDemote(sylveraCode,"promote");
  }
}

//DEMOTING IN VANILLA WORKFLOW
function demoteButton(){
  const demoteEnabled = ["Production Prep","Production Ready","Production","In App"];
  const sylveraCode = getSylveraCode(demoteEnabled,"demote","demoted",true);
  if(sylveraCode!==null){
    promoteDemote(sylveraCode,"demote")
  }
}

//BLOCKING IN VANILLA WORKFLOW
function blockButton(){
  const blockEnabled = ["Pre-Production","Production Prep","Production Ready","Production","In App"];
  const sylveraCode = getSylveraCode(blockEnabled,"block","blocked",false);
  if(sylveraCode!==null){
    raiseBlocker(sylveraCode)
  }
}

function unblockButton(){
  const unblockEnabled = ["Blocked"];
  const sylveraCode = getSylveraCode(unblockEnabled,"unblock","unblocked",true);
  if(sylveraCode!==null){
    unblockProject(sylveraCode)
  }
}

function updateButton(){
  const updateEnabled = ["In App"];
  const sylveraCode = getSylveraCode(updateEnabled,"update","updated",false);
  if(sylveraCode!==null){
    requestUpdate(sylveraCode)
  }
}

function updateCompleteButton(){
  const sheet = SpreadsheetApp.getActiveSheet();
  const sheetName = sheet.getName();
  if(sheetName==="Updates"){
    const row = SpreadsheetApp.getActiveRange().getRow();
    const updateId = sheet.getRange(row,1).getValue();
    const sylveraId = sheet.getRange(row,2).getValue();
    //Confirmation message here
    if(true){
      closeUpdate(updateId);
      completeUpdate(sylveraId,updateId)
    }
  }else{
    
  }
}

function developerButton(){
  const devEnabled = ["Pre-Production","Production Prep","Production Ready","Production","In App","Blocked"];
  const sylveraCode = getSylveraCode(devEnabled,"add developer","developer added",false);
  if(sylveraCode!==null){
    updateDeveloper(sylveraCode)
  }
}

function raiseFlagButton(){
  const flagEnabled = ["Pre-Production","Production Prep","Production Ready","Production","In App"];
  const sylveraCode = getSylveraCode(flagEnabled,"raise flag","flag raised",true);
  if(sylveraCode!==null){
    raiseFlag(sylveraCode);
  }
}


//Action that moves a given project to the following stage
function promoteDemote(code,mode){
  //Search for the row in the database
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dbSheet = ss.getSheetByName("Project DB");

  const dbCodeValues = dbSheet.getRange(globalValues.rowOffset,globalValues.sylCodeColumn,dbSheet.getLastRow()-globalValues.rowOffset+1,(globalValues.stageColumn-globalValues.sylCodeColumn+1)).getValues();
  for(let i=0;i<dbCodeValues.length;i++){
    if(dbCodeValues[i][0]===code){
      //Find current value
      let currentValue = dbCodeValues[i][globalValues.stageColumn-globalValues.sylCodeColumn];
      //Find the index of that value
      let currentIndex = stages.indexOf(currentValue);
      //Update value
      let projectType = dbCodeValues[i][globalValues.rowOffset,globalValues.projectTypeColumn-globalValues.sylCodeColumn]
      let futureValue
      if(mode==="promote"){
        futureValue = stages[currentIndex+1]
      }else if(mode==="demote"){
        futureValue=stages[currentIndex-1]
      }
      dbSheet.getRange(i+globalValues.rowOffset,globalValues.stageColumn).setValue(futureValue);

      //Log information
      const activityRange = dbSheet.getRange(i+globalValues.rowOffset,globalValues.activityColumn);
      
      updateActivity(activityRange,mode,currentValue,futureValue);
      doActions(futureValue,code,i+globalValues.rowOffset,mode,currentValue,projectType);
      break;
    }
  }
}

function doActions(stage,code,row,mode,prevStage,projectType){
  switch(mode){
    case "promote":
      let wfId = findId(projectType,prevStage,stage);
      switch(stage){
        case "Production":
          startWorkflow(code,wfId,row,globalValues.prodWorkflowColumn)
          break;
        case "Production Prep":
          startWorkflow(code,wfId,row,globalValues.prodPrepWorkflowColumn)
          break;
        case "In App":
          updateDbSingleRange(code,globalValues.prodWorkflowDateColumn,new Date());
          break;
      }
    break;

    case "demote":
      switch(prevStage){
        case "Production":
          archiveWorkflow(row)
          break;
      }
    break;
  }
}

//Function that logs the activity of any action done through the Pool controls
function updateActivity(range,mode,currentValue,futureValue){
  let today = new Date();
  let user = Session.getUser().getEmail();
  let rangeValue = range.getValue();
  let newValue = rangeValue.concat(rangeValue!==""?";":"",`[${today.toString()}] ${mode}:${currentValue}>${futureValue} (${user})`)
  range.setValue(newValue);
}

function getSylveraCode(enabledSheets,action,actionPast,conMessage){
  const range = SpreadsheetApp.getActiveRange();
  const sheet = SpreadsheetApp.getActiveSheet();
  const sheetName = sheet.getName();
  if(enabledSheets.includes(sheetName)){
    let codeText = sheet.getRange(range.getRow(),1).getValue();
    if(checkSylveraCode(codeText)){
      //Do promote action
      if(conMessage){
        if(confirmationMessage(action,codeText)){
          return codeText
        }else{
          return null
        }
      }else{
        return codeText
      }
      
    }else{
      errorMessage(actionPast)
      return null
    }
  }else{
    SpreadsheetApp.getUi().alert("Incompatible Sheet",`This function does not work from this sheet. You can run this from: ${enabledSheets.join()}`,SpreadsheetApp.getUi().ButtonSet.OK)
    return null
  }
}

function errorMessage(action){
  const ui = SpreadsheetApp.getUi();
  ui.alert("Action could not be completed",`Project could not be ${action}. Please ensure you are selecting a row with a project and a valid Sylvera code.`,ui.ButtonSet.OK);
}

//Function that asks for a confirmation message before proceeding with a task
function confirmationMessage(action,codeText){
  const ui = SpreadsheetApp.getUi();
  const confirmationMessage = ui.alert(`Proceed with ${action} action?`,`This action will ${action} project ${codeText}. Do you want to proceed`,ui.ButtonSet.YES_NO);
      if(confirmationMessage===ui.Button.YES){
        return true
      }else{
        return false
      }
}

//Checks whether a text matches the Sylvera RegEx
function checkSylveraCode(text){
  return(true)
}
