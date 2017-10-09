//Import Discord.js module
const Discord = require('discord.js');
//Import config file
const config = require('./config.json');
//Require file system module
const fs = require("fs");
//Parse in the roles available
let roles = JSON.parse(fs.readFileSync("./rolelist.json","utf8"));
//Create the discord server
const client = new Discord.Client();

//Message handler functions
//Help function
function help(message){
  message.channel.send(config.prefix + config.listrolescommand + " List the available roles that can be self assigned.");
  message.channel.send(config.prefix + config.addrolecommand + " <rolename> (Allows a user with the required role to add a role to be self assigned)");
  message.channel.send(config.prefix + config.deleterolecommand + " <rolename> (Allows a user with the required role to remove a role for self-assignment");
  message.channel.send(config.prefix + config.assignrolecommand + " <rolename> (Allows a user to assign a role to themselves)");
  message.channel.send(config.prefix + config.unassignrolecommand + " <rolename> (Allows a user to remove a role from themselves)");
}

//List roles function
function listRoles(message){
  //Since there are just keys in this JSON get the keys
  var roleKeys = Object.keys(roles);
  message.channel.send("Roles available for self-assignment.");
  //List the keys
  for(i=0; i<roleKeys.length;i++){
    message.channel.send(roleKeys[i]);
  }
}

//Bot Management check function
function botManagementCheck(message, mRole){
  //Make sure the role in config.json exists on the server
  if(!mRole){
    console.log("The config.botmanagementrole does not exist");
    return false;
  }
  //Check the user for the role
  if (!message.member.roles.has(mRole.id)){
    message.channel.send("You can't use this command");
    return false;
  }
  return true;
}

//Add Role function
function addRole(message, args, mRole){
  if(botManagementCheck(message,mRole)){
    //Make sure there is an argument
    if(args.length < 1){
      return message.channel.send("Please specify a role to add");
    }
    //Check to see if the role is present
    if(roles[args[0]]){
      message.channel.send("Role already added");
      return;
    }
    //Check to see if the role exists on the server
    var aRole = message.guild.roles.find("name", args[0]);
    //Make sure the guild has the role
    if(!aRole){
      message.channel.send("Role does not exist in guild");
      console.log("Roll in list " + args[0] + " does not exist");
      return;
    }
    //Add the role
    roles[args[0]] = {};
    //Write the role to file
    fs.writeFile("./rolelist.json", JSON.stringify(roles), (err) => {
      if (err) console.error(err)
    });
    message.channel.send("Role added");
  }
}

//Delete Role function
function deleteRole(message, args, mRole){
  if(botManagementCheck(message,mRole)){
    //Make sure there is an argument
    if(args.length < 1){
      return message.channel.send("Please specify a role to delete");
    }
    //Check to see if the role is present
    if(!roles[args[0]]){
      message.channel.send("Role not present");
    }
    else{//Remove the role
      //Remove the role
      delete roles[args[0]];
      //Update the file
      fs.writeFile("./rolelist.json", JSON.stringify(roles), (err) => {
        if (err) console.error(err)
      });
      message.channel.send("Role Removed");
    }
  }
}

//Assign Role function
function assignRole(message, args){
  //Make sure there is an argument
  if(args.length < 1){
    return message.channel.send("Please specify a role to assign");
  }
  //Check to see if role is assignable
  if(!roles[args[0]]){
    message.channel.send("That is not an assignable role");
    return;
  }
  //Make sure the guild has the role
  var aRole = message.guild.roles.find("name", args[0]);
  //Make sure the guild has the role
  if(!aRole){
    message.channel.send("Role does not exist in guild");
    console.log("Roll in list " + args[0] + " does not exist");
    return;
  }
  //Check to see if the user already has the role.
  if(message.member.roles.has(aRole)){
    message.channel.send("You already have that role.");
    return;
  }
  //Assign the role to the user
  message.member.addRole(aRole);
  message.channel.send("You have been assigned " + args[0] + " role.");
}

//Unassign Role function
function unassignRole(message, args){
  //Make sure there is an argument
  if(args.length < 1){
    return message.channel.send("Please specify a role to assign");
  }
  //Check to see if role is assignable
  if(!roles[args[0]]){
    message.channel.send("That is not an assignable role");
    return;
  }
  //Make sure the guild has the role
  var aRole = message.guild.roles.find("name", args[0]);
  //Make sure the guild has the role
  if(!aRole){
    message.channel.send("Role does not exist in guild");
    console.log("Roll in list " + args[0] + " does not exist");
    return;
  }
  //Check to see if user has the role
  if(!message.member.roles.has(aRole)){
    message.channel.send("You don't have that role.");
    return;
  }
  //Remove the role
  message.member.removeRole(aRole);
  message.channel.send("Role " + args[0] + " has been removed.");
}

// Event to listen to messages sent to the server where the bot is located
client.on('message', (message) =>{
  if(message.author.bot){return;} //Because we don't want to respond to bots
  if(!message.content.startsWith(config.prefix)){return;} //Because we only want to respond to messages that have the prefix
  if(message.content.startsWith(config.prefix)){ //Primary code to run the bot, not bothering with multiple files as it should be simple
    //Splitting up arguments and getting command
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const modRole = message.guild.roles.find("name", config.botmanagementrole);
    //Switch to handle commands
    switch(command){
      case config.helpcommand:
        help(message);
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
      default:
        message.channel.send("Unrecognized command.  Use " + config.prefix + config.helpcommand);
        break;
    }
  }
});

//Ready Event Handler
client.on('ready', () => {
  console.log('Role Assignment bot is running');
});

client.login(config.token);
