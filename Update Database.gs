//Functions that get data from the Verra registry API to update some of the project information in the database.
//Currently can obtain and compare estiamted annual emissions (not available in Berkley) and status (as most up to date will be in Verra)

function fetchFromVerra(){
  const responseRaw = UrlFetchApp.fetch("https://registry.verra.org/uiapi/resource/resourceSummary/1477");
  const response = JSON.parse(responseRaw);
  let status = response.participationSummaries[0].attributes[1].values[0].value;
  Logger.log(status);
}

function updateVerraInfo(){
  const db = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Project DB");
  const values = db.getRange(globalValues.rowOffset,2,db.getLastRow()-globalValues.rowOffset+1,6).getValues();
  const verraCode = "VCS";
  values.forEach((value,i)=>{
    if(value[0].substring(0,verraCode.length)===verraCode){
      let responseRaw = UrlFetchApp.fetch(`https://registry.verra.org/uiapi/resource/resourceSummary/${value[0].substring(verraCode.length,value[0].length)}`)
      let response = JSON.parse(responseRaw);
      let estimatedAnnualEmissions = response.participationSummaries[0].attributes[2].values[0].value;
      let status = response.participationSummaries[0].attributes[1].values[0].value;
      
      if(value[5]!=estimatedAnnualEmissions){
        let emissionsRange = db.getRange(i+globalValues.rowOffset,globalValues.predictedIssuance);
        emissionsRange.setValue(estimatedAnnualEmissions);
        emissionsRange.setBackground('blue');
        let updateRange = db.getRange(i+globalValues.rowOffset,globalValues.activityColumn);
        let updateRangeValue = updateRange.getValue();
        updateRange.setValue(`[${new Date()}] Data updated:annual emissions (Verra)${updateRangeValue!==""?";":""}${updateRangeValue}`);
      }

      if(value[4]!==status){
        let statusRange = db.getRange(i+globalValues.rowOffset,globalValues.projectStatus);
        statusRange.setValue(status);
        statusRange.setBackground('blue');
        let updateRange = db.getRange(i+globalValues.rowOffset,globalValues.activityColumn);
        let updateRangeValue = updateRange.getValue();
        updateRange.setValue(`[${new Date()}] Data updated:status (Verra)${updateRangeValue!==""?";":""}${updateRangeValue}`);
      }  
    }
  })
}

function manualAdd(projectId,voluntary,projectName,projectStatus="Unknown",country,type){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const database = ss.getSheetByName("Project DB");
  const sylveraCode = "";
  database.appendRow([projectId,voluntary,sylveraCode,projectName,projectStatus,"","","","",country,type,"Pre-Production"])
}
