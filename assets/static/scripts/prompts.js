// #############################################################################

function Prompts (filename) {
  this.max_num_prompts=3; // default maximum number of prompts
  this.list = []; // list of prompts to be read by user
  this.index=0; // pointer to position in prompt list array
  this.prompt_count = 0; // number of prompts read
  this.prompts_recorded = []; // list of prompts that have been recorded
  this.filename = filename;
}

var prompts = new Prompts('PromptList_en.txt');

// see https://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript
// Note: this is a synchronous request...
jQuery.get('/assets/static/prompts/' + prompts.filename, function(data) {
    function pad (num, size) {
      var s = num+"";
      while (s.length <= size) s = "0" + s;
      return s;
    }

    var sentences = data.split('\n');
    for (var i = 0; i < sentences.length; i++) {
      var prompt_id = $('#language').val() + pad(i,4);
      prompts.list[i] = prompt_id  + " " + sentences[i];
    }

    prompts.index = Math.floor((Math.random() * prompts.list.length) + 1);
});


$('#max_num_prompts').click(function () { 
    prompts.max_num_prompts = this.value.replace(/[^0-9\.]/g,'');

    updateProgress();

    console.log('max_num_prompts:' + prompts.max_num_prompts);
});

// ############################
Prompts.prototype.resetIndices = function () {
  this.index = Math.floor((Math.random() * prompts.list.length) + 1);
  this.prompt_count = 0; // number of prompts read
  this.prompts_recorded = []; // list of prompts that have been recorded
}

Prompts.prototype.getNextPrompt = function () {
  this.index = this.index % this.list.length
  if (this.prompt_count >= this.max_num_prompts) {
    return null;
  }
  var prompt = this.list[this.index];

  this.index++;
  this.prompt_count++;

  return prompt;
}

Prompts.prototype.getPromptId = function () {
  var prompt = this.list[this.index];
  var prompt = prompt.split(/(\s+)/);// create array

  return prompt.shift(); // return first element = prompt id
}

Prompts.prototype.getPromptSentence = function () {
  var prompt = this.list[this.index];
  var prompt = prompt.split(/(\s+)/); // create array
  prompt.shift(); // remove prompt id

  return prompt.join(""); // make string;
}

Prompts.prototype.toArray = function () {
  var temp_array = this.prompts_recorded;
  return temp_array.reverse();
}

Prompts.prototype.toJsonString = function () {
  var arr = this.prompts_recorded;
  var obj = {};

  // reverses array
  var end = arr.length - 1;
  for (var i = end ; i >= 0 ; i--)
  {
    var prompt_line = arr[i].split(/\s+/);
    var prompt_id = prompt_line.shift();
    // join array back together into a string and remove trailing space
    obj[prompt_id] = prompt_line.join(' ').replace(/\s+$/, "");
  }

  return JSON.stringify(obj,null,"  ");
}

Prompts.prototype.maxPromptsReached = function () {
  return this.prompt_count >= this.max_num_prompts;
}

Prompts.prototype.getProgressDescription = function () {
  return this.prompt_count + "/" + this.max_num_prompts;
}
