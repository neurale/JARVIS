var nn;

function Perceptron(input, hidden, output)
{
    // create the layers
    var inputLayer = new Layer(input);

    // a perceptron can have more hidden layers
    var hiddenLayers = [];
    _.each(hidden, function (neuronNum) {
      var hiddenLayer = new Layer(neuronNum);

      hiddenLayers.push(hiddenLayer);
    });
    var outputLayer = new Layer(output);

    // connect the layers
    inputLayer.project(hiddenLayers[0]);
    for (i = 1; i < hiddenLayers.length; i++) {
      hiddenLayers[i-1].project(hiddenLayers[i]);
    }
    hiddenLayers[hiddenLayers.length - 1].project(outputLayer);

    // set the layers
    this.set({
        input: inputLayer,
        hidden: hiddenLayers,
        output: outputLayer
    });
}

// CREATE THE NETWORK
function networkStructure() {
  var input = parseInt($('input[name=input-nodes]').val());

  var hidden = [];
  $('input[name=hidden-nodes]').each(function(el) {
    if ($(this).val())
      hidden.push(parseInt($(this).val()));
  });
  var output = parseInt($('input[name=output-nodes]').val());

  Perceptron.prototype = new Network();
  Perceptron.prototype.constructor = Perceptron;
  var myPerceptron = new Perceptron(input, hidden, output);
  return myPerceptron;
}

// RETRIEVE AND PREPARE TRAINING DATA
// The format of the train set has to be a list of objects, each with
// 'input' property that is a list of input values, and 'output' that is
// also a list of output values.
function trainingSet() {
  var inputNum = parseInt($('input[name=input-nodes]').val());
  var outputNum = parseInt($('input[name=output-nodes]').val());
  var dataRowLen = inputNum + outputNum;
  var trainingData = $("textarea[name=training-data]").val().split('\n');
  var trainSet = [];

  _.forEach(trainingData, function(train_row) {
    var values = train_row.split(',');

    // training data items count has to be same
    // as input_nodes+output_nodes count.
    if (values.length > dataRowLen)
      throw 'Inconsistent training data';

    trainSet.push({
      'input': _.first(values, inputNum),
      'output': _.last(values, outputNum)
    });
  });

  return trainSet;
}

function trainNetwork() {
  var myPerceptron = networkStructure();
  var myTrainer = new Trainer(myPerceptron);
  var trainingData = trainingSet();

  var rate = parseFloat($('input[name=learning-rate]').val()),
      iterations = parseInt($('input[name=iterations]').val()),
      error = parseFloat($('input[name=error-rate]').val()),
      shuffle = $('input[name="shuffle"]').is(':checked'),
      cost = $('select[name=cost]').val();

  myPerceptron.setOptimize(false);
  errorList = [];
  myTrainer.train(trainingData, {
    rate: rate,
    iterations: iterations,
    error: error,
    shuffle: shuffle,
    cost: Trainer.cost[cost],
    schedule: {
      every: 50,
      do: function(data) {
          errorList.push(data.error);
      }
    }
  });
  drawErrorRateGraphCanvas();
  return myPerceptron;
}


function addToResultTable(data) {
  var total_variance = 0;
  _.each(data, function(el) {
    total_variance += el.variance;
    $('table.test-output tr:last').after(
      '<tr><td>'+
      el.input+
      '</td><td>'+
      el.result+
      '</td><td>'+
      el.expected+
      '</td><td>'+
      el.variance+
      '</td></tr>'
    );
  });

  $('table.test-output tr:last').after(
    '<tr class="active"><td colspan="3">Average variance</td>'+
    '<td>' + (total_variance / data.length) + '</td></tr>'
  );
}

// TEST / RUN THE NETWORK
$('button.train-network').click(function() {
  nn = trainNetwork();
  initNetworkSvg();
});

$('button.test-network').click(function() {
  var testingData = $("textarea[name=test-data]").val().split('\n');
  var inputNum = parseInt($('input[name=input-nodes]').val());
  var outputNum = parseInt($('input[name=output-nodes]').val());
  var dataRowLen = inputNum + outputNum;
  var trainingResults = [],
      output;

  _.forEach(testingData, function(row) {
    var values = row.split(',');
    if (values.length > dataRowLen + 1)
      throw 'Inconsistent testing data!';
    output = nn.activate(_.first(values, inputNum));
    trainingResults.push({
      input: values,
      result: output,
      expected: values[values.length - 1],
      variance: Math.abs(values[values.length - 1] - output)
    });
  });

  addToResultTable(trainingResults);
});

// SAVE THE NETWORK
$('button.save-network').click(function() {
  var data = JSON.stringify(nn.toJSON());
  var url = 'data:text/json;charset=utf8,' + encodeURIComponent(data);
  window.open(url, '_blank');
  window.focus();
});

// LOAD THE NETWORK
$('button.load-network').click(function() {
  var network = $('textarea[name=load-network-content]').val();
  nn = Network.fromJSON(JSON.parse(network));
  initNetworkSvg();
});