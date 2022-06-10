//Functions that import any requests from clients, logged in a form, into the database.

function importRequests(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const database = ss.getSheetByName("Project DB");
  const requestSheet = ss.getSheetByName("Client Requests");
  const coverPage = ss.getSheetByName("Cover Page");

  const supportedProjectsString = coverPage.getRange("E48").getValue();
  const supportedProjectsArray = supportedProjectsString.split(",");

  //For each sheet that hasn't been already imported, collate all the requests codes.
  const requests = requestSheet.getRange(2,1,Math.max(requestSheet.getLastRow()-1,1),30).getValues();

  //For each request code, iterate database and add to current count
  let allCodesArray = [];
  requests.forEach((r,i)=>{
    if(supportedProjectsArray.includes(r[3])&&r[28]===""&&r[29]===""){
      let jointValue = r[5]+r[6]+r[7]+r[8]+r[9]+r[10]+r[11]+r[12]+r[13]+r[15]+r[24];
      let splitCodes = jointValue.split(", ");
      let codesOnly = splitCodes.map(code=>{
        return code.substring(0,code.indexOf(" "))
      });

      allCodesArray = [...allCodesArray,...codesOnly]
      requestSheet.getRange(i+2,30).setValue(true);
      requestSheet.getRange(i+2,32).setValue(codesOnly.join(","));
    }
  })

  //Update requests to mark them as imported
  let databaseValues = database.getRange(globalValues.rowOffset,2,database.getLastRow()-globalValues.rowOffset+1).getValues();
  allCodesArray.forEach(code=>{
    for(let i=0;i<databaseValues.length;i++){
      if(databaseValues[i][0]===code){
        let dbRange = database.getRange(i+globalValues.rowOffset,globalValues.customerRequests);
        let dbRangeValue = dbRange.getValue();
        dbRange.setValue(dbRangeValue+1);
        break
      }
    }
  });

}
