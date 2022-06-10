function generateTaskView(){
  const type = "ARR";
  const stage = "Production";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportSheet = ss.getSheetByName("ARR Detailed View");
  const dbSheet = ss.getSheetByName("Project DB");
  const dbValues = dbSheet.getRange(globalValues.rowOffset,4,dbSheet.getLastRow()-globalValues.rowOffset,globalValues.prodWorkflowColumn-3).getValues();
  const firstColumn = 2;
  const firstTasksColumn =4;

  //Filter the values to get the projects that match the type and stage
  const filteredValues = dbValues.filter(value=>{
    return(value[8]==type&&value[9]==stage)
  });

  //Dump the information into the sheet
  const dumpArray = [];
  filteredValues.forEach((value,index)=>{
    dumpArray.push([`=VLOOKUP(B${index+3},'ARR Priority (Temporary)'!$A$1:$B,2,false)`,value[0],value[globalValues.prodWorkflowColumn-4]]) //TODO - This is currently hardcoded to get production workflow -> This would need to be dynamic
  });

  //Last updated by
  const apiKey = "api_mwsrdRpI0R3wFBzF981DgA";
  const params = {headers:{"X-API-KEY":apiKey},method:"get"}; 
  dumpArray.forEach(item=>{
    let rawResponse = UrlFetchApp.fetch(`https://public-api.process.st/api/v1.0/workflow-runs/${item[2]}/form-fields`,params);
    let response = JSON.parse(rawResponse);
    let entry
    response.fields.forEach(field=>{
      if(field.key==="Analyst_1"){
        entry = field.data
      }
    })
    item.push(entry===null?"Not started":entry.value.substr(0,entry.value.indexOf("@sylvera.io")))
  })

  //For each one, get detailed information from PS API
  const allTasks = getAll("https://public-api.process.st/tasks");
  const taskIdsRaw = reportSheet.getRange(1,firstTasksColumn+firstColumn-1,1,reportSheet.getLastColumn()-4).getValues();
  const taskIds = getTasks(taskIdsRaw);
  
  dumpArray.forEach((value,index)=>{
    for(let i=0;i<allTasks.length;i++){
      if(value[2]==allTasks[i].checklistId){
        for(let j=0;j<taskIds.length;j++){
          if(taskIds[j].id.includes(allTasks[i].taskTemplateId)){
            dumpArray[index][j+firstTasksColumn]=allTasks[i].hidden?"N/A":allTasks[i].status
          }
        }
      }
    }
  })

  //Paste the information
  reportSheet.getRange(3,1,Math.max(reportSheet.getLastRow()-1,1),Math.max(reportSheet.getLastColumn(),1)).clearContent();
  const pasteRange = reportSheet.getRange(3,1,dumpArray.length,dumpArray[0].length);
  pasteRange.setValues(dumpArray);
  reportSheet.getRange(1,1).setValue(`Last updated:${new Date()}`)

  //Update names
  const taskNames = [taskIds.map(t=>{return(t.name)})]
  reportSheet.getRange(2,firstTasksColumn+1,1,taskNames[0].length).setValues(taskNames);

  //Sort table
  reportSheet.getRange(3,1,dumpArray.length,reportSheet.getLastColumn()).sort(1)


}

function getAll(url){
  const apiKey = "api_mwsrdRpI0R3wFBzF981DgA";
  const params = {headers:{"X-API-KEY":apiKey},method:"get"};
  let allResponses = [];

  let responseRaw = UrlFetchApp.fetch(url,params);
  let response = JSON.parse(responseRaw);
  allResponses.push(response);
  let loop = true;
  
  while(loop){
    if(response.hasMore){
      let nextPageId = response.nextPageId;
      let nextDate = response.nextPageUpdatedDate;
      let secondParams = {headers:{"X-API-KEY":apiKey},method:"get",async:true};
      responseRaw = UrlFetchApp.fetch(`${url}?limit=500&afterId=${nextPageId}&afterUpdatedDate=${nextDate}`,secondParams);
      response = JSON.parse(responseRaw);
      response.data.forEach(d=>{
        allResponses.push(d);
      })
    }else{
      loop=false
    }
  }
  
  return allResponses
}

//Gets all the task Ids related to a given stable Id
function getTasks(impTasks){

  const tasksToObtain = [];
  impTasks[0].forEach(t=>{
    tasksToObtain.push({perId:t,id:[],name:null});
  })

  const allTasks = getAll("https://public-api.process.st/task-templates");
  tasksToObtain.forEach((task)=>{
    allTasks.forEach(t=>{
      if(t.stableId===task.perId){
        task.id.push(t.id);
        task.name=t.name;
      }
    })
  });

  return tasksToObtain 
}

function compareDates(date1,date2){
  if(Date.parse(date1) > Date.parse(date2)){
   return true
}else{
  return false
}
}
