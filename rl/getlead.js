importScripts("/js/sl.js");
SL.import("/js/rl/exec.js");

SL.import("/js/rl/table.js");
SL.import("/js/rl/file.js");
SL.import("/js/rl/http.js");
SL.import("/js/rl/console.js");

SL.import("/marketo/apimanager.js");

var MARKETO_API_ENDPOINT = "https://909-MRO-770.mktorest.com";
var MARKETO_CLIENT_ID ="7be388a3-a678-411b-9668-090496940dee";
var MARKETO_CLIENT_SECRET = "D3lpSQ54DDdfW8jhYdfSXs1pwoaPlbYl";

console.log(main);

function main() {
  RL.print("init API Manager");
  var apiManager = new Marketo.APIManager(MARKETO_CLIENT_ID,
                                          MARKETO_CLIENT_SECRET,
                                          MARKETO_API_ENDPOINT);
  
  RL.print("describeLead");
  var result = apiManager.describeLead();
  
  RL.print(JSON.stringify(result));
  RL.export(
    "result.json",
    new Blob([JSON.stringify(result)], {tyoe: "application/json"})
  );
}
