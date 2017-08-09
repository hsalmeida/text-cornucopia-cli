#!/usr/bin/env node
const fs = require('fs');
const readline = require('readline');
const figlet = require('figlet');
const chalk = require('chalk');
const clear = require('clear');
const inquirer = require('inquirer');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const PropertiesReader = require('properties-reader');
const redis = require('redis');
const log = console.log;

let redisClient;
let properties;

var inputDirectory;
var inputFile;
var inputType;
var inputHeader;
var inputSeparator;
var inputCompletePath;

clear();
log(
    chalk.blue(figlet.textSync('Text Cornucopia Tool', {
        horizontalLayout: 'default',
        verticalLayout: 'default'
    }))
);

getUserOptions((answers) => {

    let status = new Spinner('generating in outputs, please wait...');

    let inputFileLocation = answers.properties === "." ? "./input.properties" : answers.properties;
    properties = PropertiesReader(inputFileLocation);

    checkParams(answers, (answerParams) => {

        let redisHost = properties.get('redis.out.hostname');
        let redisPort = properties.get('redis.out.port');
        let redisDB = properties.get('redis.out.db');
        var redisParams = { redisHost: "", redisPort: "", redisDB: "" };

        var separator = properties.get('cornucopia.input.separator');


        redisParams.redisHost = redisHost === "" ? answerParams.host : redisHost;
        redisParams.redisPort = redisPort === "" ? answerParams.port : redisPort;
        redisParams.redisDB = redisDB === "" ? answerParams.db : redisDB;

        initRedis(redisParams);
        generateCompletePath();

        var file = inputCompletePath;

        var outFile;
        var outCSV;
        var txtStream;
        var csvStream;
        var txtPattern;
        var csvPattern;
        var csvHeader;

        if (answers.outs.indexOf('txt') !== -1) {
            outFile = generateOutFilePath(properties);
            txtStream = fs.createWriteStream(outFile);
            txtPattern = properties.get('txt.out.pattern');
        }
        if (answers.outs.indexOf('csv') !== -1) {
            outCSV = generateOutCSVPath(properties);
            csvStream = fs.createWriteStream(outCSV);
            csvPattern = properties.get('csv.out.pattern');
            csvHeader = properties.get('csv.out.header');
        }

        status.start();

        const rl = readline.createInterface({
            input: fs.createReadStream(file)
        });
        var rowCount = 0;

        rl.on('line', (line) => {
            var elements = line.split(separator);
            var copyTxtPattern;
            var copyCSVPattern;

            if (answers.outs.indexOf('txt') !== -1) {
                copyTxtPattern = String(txtPattern);
            }
            if (answers.outs.indexOf('csv') !== -1) {
                copyCSVPattern = String(csvPattern);
            }

            for (var i = 0; i < elements.length; i++) {
                var repStr = '\\$' + i;
                var re = new RegExp(repStr, 'gim');
                if (answers.outs.indexOf('txt') !== -1) {
                    copyTxtPattern = copyTxtPattern.replace(re, elements[i].trim());
                }
                if (answers.outs.indexOf('csv') !== -1) {
                    copyCSVPattern = copyCSVPattern.replace(re, elements[i].trim());
                }
            }

            if (answers.outs.indexOf('redis') !== -1) {
                if (elements && elements.length == 2) {
                    redisClient.set(elements[0], elements[1]);
                }
                if (elements && elements.length > 2) {
                    redisClient.hset(elements);
                }
            }

            if (answers.outs.indexOf('txt') !== -1) {
                txtStream.write(copyTxtPattern + "\r\n");
            }

            if (answers.outs.indexOf('csv') !== -1) {
                if (rowCount === 0 && csvHeader) {
                    //var header
                    let headers = properties.get('csv.out.headers').split(',');
                    let csvFileHeader = "";
                    for (var hindex = 0; hindex < headers.length; hindex++) {
                        csvFileHeader += hindex === (headers.length - 1) ? headers[hindex] : headers[hindex] + ',';
                    }
                    csvStream.write(csvFileHeader + "\r\n");
                }
                csvStream.write(copyCSVPattern + "\r\n");
            }
            rowCount++;
            //log(copyPattern);

        }).on('close', () => {
            status.stop();

            if (answers.outs.indexOf('redis') !== -1) {
                log(chalk.red('redis generation complete'));
            }

            if (answers.outs.indexOf('txt') !== -1) {
                log(chalk.yellow(outFile + ' generation complete'));
            }

            if (answers.outs.indexOf('csv') !== -1) {
                log(chalk.cyan(outCSV + ' generation complete'));
            }

            log(chalk.green('Have a great day!'));
            process.exit(0);
        });

    });
});

function generateOutFilePath(properties) {
    return properties.get('txt.out.directory') + "/" + properties.get('txt.out.file');
}

function generateOutCSVPath(properties) {
    return properties.get('csv.out.directory') + "/" + properties.get('csv.out.file');
}

function generateCompletePath() {
    if (!inputDirectory) {
        inputDirectory = "."
    }
    inputCompletePath = inputDirectory + "/" + inputFile;
}

function initRedis(redisParams) {
    let redisConnUri = 'redis://' + redisParams.redisHost + ":" + redisParams.redisPort + "/" + redisParams.redisDB;
    redisClient = redis.createClient(redisConnUri);
}

function getUserOptions(callback) {
    var questions = [
        {
            name: 'properties',
            type: 'input',
            message: 'location of properties file (input.properties) or . for actual location',
            validate: function (value) {
                if (value.length) {
                    if (value === ".") {
                        value = "./input.properties";
                    }
                    if (fs.existsSync(value)) {
                        return true;
                    } else {
                        return 'Please enter a valid file';
                    }
                } else {
                    return 'Please enter a valid location';
                }
            }
        },
        {
            type: 'checkbox',
            message: 'Select outputs',
            name: 'outs',
            choices: [
                {
                    name: 'txt'
                },
                {
                    name: 'csv'
                },
                {
                    name: 'redis'
                }
            ],
            validate: function (answer) {
                if (answer.length < 1) {
                    return 'You must choose at least one output.';
                }
                return true;
            }
        }
    ];
    inquirer.prompt(questions).then(callback);
}

function checkParams(answers, callback) {

    let questions = [];

    inputDirectory = properties.get('cornucopia.input.directory');
    inputFile = properties.get('cornucopia.input.file');
    inputType = properties.get('cornucopia.input.type');
    inputHeader = properties.get('cornucopia.input.header');
    inputSeparator = properties.get('cornucopia.input.separator');

    if (!inputDirectory) {
        questions.push({
            name: 'inputDirectory',
            type: 'input',
            message: 'input directory not found in properties file, enter a valid directory ou press <enter> for actual directory',
            validate: function (value) {
                return true;
            }
        });
    }


    if (!inputFile) {
        questions.push({
            name: 'inputFile',
            type: 'input',
            message: 'input file not found in properties file, enter a valid file or * for all files in directory',
            validate: function (value) {
                if (value.length) {
                    if (value === "*") {
                        return true;
                    }
                    let path = ".";
                    if (inputDirectory) {
                        path = inputDirectory;
                    }
                    if (fs.existsSync(path + "/" + value)) {
                        return true;
                    } else {
                        return 'Please enter a valid file';
                    }
                } else {
                    return 'Please enter a valid location';
                }
            }
        });
    }

    if (!inputType) {
        questions.push({
            name: 'inputType',
            type: 'input',
            message: 'input type not found in properties file, enter a valid type or press <enter> for txt',
            validate: function (value) {
                return true;
            }
        });
    }

    if (inputType === "csv" && inputHeader === "") {
        questions.push({
            name: 'inputHeader',
            type: 'input',
            message: 'input header for csv not found in properties file, enter true or false or press <enter> for false',
            validate: function (value) {
                return true;
            }
        });
    }

    if (!inputSeparator) {
        questions.push({
            name: 'inputSeparator',
            type: 'input',
            message: 'input separator not found in properties file, enter a valid separator or press <enter> for comma (,)',
            validate: function (value) {
                return true;
            }
        });
    }

    if (answers.outs.indexOf('txt') !== -1) {

    }

    if (answers.outs.indexOf('csv') !== -1) {

    }

    if (answers.outs.indexOf('redis') !== -1) {
        let redisHost = properties.get('redis.out.hostname');
        let redisPort = properties.get('redis.out.port');
        let redisDB = properties.get('redis.out.db');

        if (!redisHost) {
            questions.push({
                name: 'host',
                type: 'input',
                message: 'redis host not find in properties file, enter a valid host or press <enter> for 127.0.0.1',
                validate: function (value) {
                    return true;
                }
            });
        }

        if (!redisPort) {
            questions.push({
                name: 'port',
                type: 'input',
                message: 'redis port not find in properties file, enter a valid port or press <enter> for 6379',
                validate: function (value) {
                    return true;
                }
            });
        }

        if (!redisDB) {
            questions.push({
                name: 'db',
                type: 'input',
                message: 'redis db not find in properties file, enter a valid db or press <enter> for 0',
                validate: function (value) {
                    return true;
                }
            });
        }
    }

    inquirer.prompt(questions).then(callback);
}