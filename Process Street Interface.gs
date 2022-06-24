//Function that starts workflows for any production prep projects 
function startWorkflow(name,id,row,column,archivedColumn=null){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const dbSheet = ss.getSheetByName("Project DB");
  //Check if a workflow already exists
  const psLink = "https://app.process.st/checklists/";

if(archivedColumn!==null){
  const archivedWorkflows = dbSheet.getRange(row,archivedColumn).getValue();
  if(archivedWorkflows!==""){
    //An archived worfklow exists
    const archivedMessage = ui.alert("Archived workflow detected","There is an archived workflow for this project. Do you want to reactivate it?",ui.ButtonSet.YES_NO);
    if(archivedMessage===ui.Button.YES){
      let allArchived = archivedWorkflows.split(",");
      let chosenWorkflow = allArchived[allArchived.length-1];
      archiveActivateWorkflow("activate",chosenWorkflow);
      allArchived.pop();
      dbSheet.getRange(row,archivedColumn).setValue(allArchived.join(","));
      dbSheet.getRange(row,column).setFormula(`=hyperlink("${psLink+chosenWorkflow}";"${chosenWorkflow}")`)
      return
    }
  }
}
  
  
  const confirmationMessage = ui.alert("Do you want to start a new PS Workflow?","Please confirm whether you want to start a Process Street Workflow",ui.ButtonSet.YES_NO);
  if(confirmationMessage===ui.Button.YES){
    const workflow = createWorkflow(name,id);
    if(workflow.success){
      dbSheet.getRange(row,column).setFormula(`=hyperlink("${psLink+workflow.id}";"${workflow.id}")`)
    }
  }
}

function createWorkflow(wfName,workflowId){
  const apiKey = "api_mwsrdRpI0R3wFBzF981DgA";
  const body = {workflowId,name:wfName}
  const url = `https://public-api.process.st/api/v1.0/workflow-runs/`;

  const params = {headers:{"X-API-KEY":apiKey},method:"post",muteHttpExceptions:true,async:true,"contentType":"application/json",payload:JSON.stringify(body)};

  let responseRaw = UrlFetchApp.fetch(url,params);
  let response = JSON.parse(responseRaw);
  
  if(response.id!==null){
    return {success:true,id:response.id}
  }else{
    return {sucess:false}
  }
}

function tryAPI(){
  createWorkflow("Trial","kpt0iKJZ1f0OtMcKCN9ECA");
}

function findId(projectType,initialStage,nextStage){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PS Workflows");
  const values = sheet.getRange(3,1,sheet.getLastRow()-1,4).getValues();
  let workflowId
  values.forEach(value=>{
    if(value[0]===projectType&&value[1]===initialStage&&value[2]===nextStage){
      workflowId = value[3];
    }
  });
  return workflowId
}

function archiveActivateWorkflow(mode,wfId){
  const apiKey = "api_mwsrdRpI0R3wFBzF981DgA";
  
  //Get workflow information
  const url = `https://public-api.process.st/api/v1.0/workflow-runs/${wfId}`;
  const readParams = {headers:{"X-API-KEY":apiKey},method:"get"};
  const wfInfoRaw = UrlFetchApp.fetch(url,readParams);
  const wfInfo = JSON.parse(wfInfoRaw);
  let name
  let status = mode==="archive"?"Archived":"Active";
  const archiveText=" - Cancelled";

  if(mode==="archive"){
    name = `${wfInfo.name}${archiveText}`
  }else if(mode==="activate"){
    name = wfInfo.name.substr(0,wfInfo.name.indexOf(archiveText))
  }else{
    return
  }

  const body = {name,status}
  const putParams = {headers:{"X-API-KEY":apiKey},method:"put",muteHttpExceptions:true,async:true,"contentType":"application/json",payload:JSON.stringify(body)};
  UrlFetchApp.fetch(url,putParams);  
}

function archiveTrial(){
  archiveWorkflow(93)
}

function archiveWorkflow(row,archiveColumn,activeColumn){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const db = ss.getSheetByName("Project DB");
  const wfValue = db.getRange(row,activeColumn).getValue();
  Logger.log(wfValue)

  //Check if workflow exists
  if(wfValue===""){
    return
  }

  //Workflow exists

  //Update the database
  let archivedRange = db.getRange(row,archiveColumn)
  let archivedValue = archivedRange.getValue();
  if(archivedValue===""){
    archivedRange.setValue(wfValue)
  }else{
    let tempArray = archivedValue.split(",");
    tempArray.push(wfValue);
    archivedRange.setValue(tempArray.join(","));
  };
  db.getRange(row,activeColumn).setValue("");

  //Archive the workflow
  archiveActivateWorkflow("archive",wfValue);
}
