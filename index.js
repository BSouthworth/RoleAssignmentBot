//Import Discord.js module
const Discord = require("discord.js");
//Import config file
const config = require("./config.json");
//Import some internal options rather than use magic numbers
const intOpt = require("./InternalOptions.json");
//Require file system module
const fs = require("fs");
//Used for credits
const crd = require("./package.json");
//Check for the existence of the file
let roles;
if(!fs.existsSync("./rolelist.json")){
  roles = {version:1.0, roles:[]};
}
else{
  roles = JSON.parse(fs.readFileSync("./rolelist.json","utf8"));
}
//Create the discord server
const client = new Discord.Client();

//Check to see if roles is in the pre version
function isRolesPreVersion(){
  if(roles.version === undefined){
    return true;
  }
  else{
    return false;
  }
}

//Update to the current the first version of roles.json
function updateRolesVersionToFirst(){
  var roles2 = {version:1.0, roles:[]};
  //Changing this over so I need the key values
  let roleKeys = Object.keys(roles);
  for(let i=0; i<roleKeys.length;i++){
    roles2.roles.push(roleKeys[i]);
  }
  fs.writeFile("./rolelist.json", JSON.stringify(roles2), (err) => {
    if (err) console.log(err);
  });
  //Roles is now updated.
  roles = JSON.parse(fs.readFileSync("./rolelist.json","utf8"));
}

//Function to handle sending a message to the channel
function sendTxt(message, txtStr){
  let messageAttempts = 1;
  function sendActualTxt(message, txtStr){
    message.channel.send(txtStr)
      .then(m => {m;}) //No need to do anything on success.
      .catch(error => { //Going to try to send it a few times, but report error if it continues to fail.
        if(messageAttempts === intOpt.MaxMessageAttempts){
          console.log(`Unable to send message due to ${error}`);
          if(intOpt.terminateonMsgSendFail){ //If a message fails to be sent to the channel terminate if true
            process.exit();
          }
        }
        else{
          messageAttempts++; //Increment message attempts
          setTimeout(sendTxt, intOpt.DelayIntervalBeforeResendingMessage, message, txtStr);  //Try Sending message again
        }
      });
  }
  sendActualTxt(message, txtStr);
}

//Bot Management check function
function botManagementCheck(message, mRole){
  //Make sure the role in config.json exists on the server
  if(!mRole){
    console.log("The config.botmanagementrole does not exist");
    return false;
  }
  //Check the user for the role
  if(message.member.roles.has(mRole.id)){
    return true;
  }
  else{
    return false;
  }
}

//Message handler functions
//Help function
function help(message, mRole){
  let helpString = config.prefix + config.helpcommand + " Display the help command.\n" +
    config.prefix + config.listrolescommand + " List the available roles that can be self assigned.\n";
  if(botManagementCheck(message,mRole)){
    helpString += config.prefix + config.addrolecommand + " <rolename> (Allows a user with the required role to add a role to be self assigned)\n" +
      config.prefix + config.deleterolecommand + " <rolename> (Allows a user with the required role to remove a role for self-assignment\n";
  }
  helpString += config.prefix + config.assignrolecommand + " <rolename> (Allows a user to assign a role to themselves)\n" +
    config.prefix + config.unassignrolecommand + " <rolename> (Allows a user to remove a role from themselves)\n" +
    config.prefix + config.creditscommand + " Displays the credits behind the bot.";
  //This is a promise to send the message to the channel.
  sendTxt(message, helpString);
}

//List roles function
function listRoles(message){
  //Since there are just keys in this JSON get the keys
  sendTxt(message, "Roles available for self-assignment, seperated by spaces.");
  let widthcount = 0;
  let rolesstring = "";
  for(let i=0;i<roles.roles.length;i++){
    if(rolesstring.length >= intOpt.StringLengthToSend){
      sendTxt(message,rolesstring);
      rolesstring = "";
      widthcount = 0;
    }
    if(roles.roles[i].length > intOpt.LineLessThan80 && widthcount != 0){
      rolesstring += "\n";
      rolesstring += roles.roles[i];
      rolesstring += "\n";
      widthcount = 0;
    }
    else if(roles.roles[i].length > intOpt.LineLessThan80){
      rolesstring += roles.roles[i];
      rolesstring += "\n";
    }
    else if(widthcount === 0){
      rolesstring += roles.roles[i];
      widthcount += roles.roles[i].length;
    }
    else if((roles.roles[i].length + widthcount) > intOpt.LineLessThan80){
      rolesstring += "\n";
      rolesstring += roles.roles[i];
      widthcount = roles.roles[i].length;
    }
    else{
      rolesstring += "    ";
      rolesstring += roles.roles[i];
      widthcount++;
      widthcount += roles.roles[i].length;
    }
  }
  sendTxt(message, rolesstring);
}

//Check to see if the role is currently added.
function isRoleAdded(arg){
  if(roles.roles.indexOf(arg)>=0){
    return true;
  }
  else{
    return false;
  }
}

//Add Role function
function addRole(message, args, mRole){
  if(!botManagementCheck(message,mRole)){
    sendTxt(message, "Insufficient privledges to use that command.");
  }
  else{
    //Make sure there is an argument
    if(args.length < 1){
      sendTxt(message, "Please specify a role to add.");
      return;
    }
    //Check to see if the role is already present
    if(isRoleAdded(args[0])){
      sendTxt(message, "Role is already added.");
      return;
    }
    //Check to see if the role exists on the server
    let aRole = message.guild.roles.find("name", args[0]);
    //Make sure the guild has the role
    if(!aRole){
      sendTxt(message, "Role does not exist in guild");
      console.log("Role " + args[0] + " does not exist.");
      return;
    }
    //Add the role
    roles.roles.push(args[0]);
    //Write the role to file, NEXT IMPROVEMENT will focus on giving better error management here.
    fs.writeFile("./rolelist.json", JSON.stringify(roles), (err) => {
      if (err) console.error(err);
    });
    sendTxt(message, "Role added.");
  }
}

//Delete Role function
function deleteRole(message, args, mRole){
  if(!botManagementCheck(message,mRole)){
    sendTxt(message, "Insufficient privledges to use that command.");
  }
  else{
    //Make sure there is an argument
    if(args.length < 1){
      sendTxt(message, "Please specify a role to make non-self assignable.");
      return;
    }
    //Check to see if the role is present
    if(!isRoleAdded(args[0])){
      sendTxt(message, "Role is not present.");
      return;
    }
    let index = roles.roles.indexOf(args[0]);
    if(index > -1){
      roles.roles.splice(index,1);
    }
    //Update the file
    fs.writeFile("./rolelist.json", JSON.stringify(roles), (err) => {
      if (err) console.error(err);
    });
    sendTxt(message, "Role Removed.");
  }
}

//Assign Role function
function assignRole(message, args){
  //Make sure there is an argument
  if(args.length < 1){
    sendTxt(message, "Please specify a role to self-assign.");
    return;
  }
  //Check to see if role is assignable
  if(roles.roles.indexOf(args[0]) < 0){
    sendTxt(message, "That is not a self-assignable role.");
    return;
  }
  //Make sure the guild has the role
  let aRole = message.guild.roles.find("name", args[0]);
  if(!aRole){
    sendTxt(message, "Role does not exist in guild.");
    console.log("Self-assignable role " + args[0] + " does not exist in guild.");
    return;
  }
  //Check to see if the user already has the role.
  if(message.member.roles.has(aRole.id)){
    sendTxt(message,"You already have that role.");
    return;
  }
  //Assign the role to the user
  message.member.addRole(aRole)
    .then(m => {m; sendTxt(message, "You have been assigned " + args[0] + " role.");})
    .catch(err =>{
      if(err.code === 50001)
      {
        sendTxt(message, "Bot requires Manage Roles permission.");
        console.log("Bot requires Manage Roles permission in the guild.");
      }
      console.log(err.message);
    });
}

//Unassign Role function
function unassignRole(message, args){
  //Make sure there is an argument
  if(args.length < 1){
    sendTxt(message, "Please specify a role to remove.");
    return;
  }
  //Check to see if role is assignable
  if(roles.roles.indexOf(args[0]) < 0){
    sendTxt(message, "That is not a self-assignable role.");
    return;
  }
  //Make sure the guild has the role
  let aRole = message.guild.roles.find("name", args[0]);
  if(!aRole){
    sendTxt(message, "You don't have that role.");
    console.log("Self-assignable role " + args[0] + " does not exist in guild.");
    return;
  }
  //Check to see if the user already has the role.
  if(!message.member.roles.has(aRole.id)){
    sendTxt(message,"You don't have that role.");
    return;
  }
  //Remove the role
  message.member.removeRole(aRole)
    .then(m => {m; sendTxt(message, "Role " + args[0] + " has been removed.");})
    .catch(err =>{
      if(err.code === 50001)
      {
        sendTxt(message, "Bot requires Manage Roles permission.");
        console.log("Bot requires Manage Roles permission in the guild.");
      }
      console.log(err.message);
    });
}

//Display the credits
function displayCredits(message){
  sendTxt(message, "A discord.js bot");
  sendTxt(message, "Author: " + crd.author);
  sendTxt(message, "Version: " + crd.version);
  sendTxt(message, "Description: " + crd.description);
  sendTxt(message, "License: " + crd.license);
  sendTxt(message, "URL: " + crd.repository.url);
}

//Message Event Handler
client.on("message", message =>{
  if(message.author.bot){return;}//Because we don't want to respond to bots.
  if(!message.content.startsWith(config.prefix)){return;} //Because we only want to respond to messages that have the prefix
  if(message.content.startsWith(config.prefix)){ //Primary code to run the bot, not bothering with multiple files as it should be simple
    //Splitting up arguments and getting command
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const modRole = message.guild.roles.find("name", config.botmanagementrole);
    //Switch to handle commands
    switch(command){
    case config.helpcommand:
      help(message, modRole);
      break;
    case config.listrolescommand:
      listRoles(message);
      break;
    case config.addrolecommand:
      addRole(message, args, modRole);
      break;
    case config.deleterolecommand:
      deleteRole(message, args, modRole);
      break;
    case config.assignrolecommand:
      assignRole(message, args);
      break;
    case config.unassignrolecommand:
      unassignRole(message, args);
      break;
    case config.creditscommand:
      displayCredits(message);
      break;
    default:
      sendTxt(message, "Unrecognized command.  Use " + config.prefix + config.helpcommand);
      break;
    }
  }
});

//Ready Event Handler, Not designed for being run on more than one server
client.on("ready", () => {
  //Checks to see if JSON file is in the pre-version and updates it to 1.0
  if(isRolesPreVersion()){
    updateRolesVersionToFirst();
    console.log("JSON file has been updated.");
  }
  //UNLIKELY FUTURE, Need to update JSON file again
  //If the json file ever changes again it can be found via a version change
  console.log("Role Assignment bot is running");
});

client.login(config.token);
