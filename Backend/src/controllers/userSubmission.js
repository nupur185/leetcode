const axios= require('axios');
const Problem= require("../models/problem");
const Submission= require("../models/submission");
const User= require("../models/user");
const {getLanguageById,submitBatch,submitToken}= require("../utils/problemUtility");

const extMap = {
      cpp: 'cpp',
      python: 'py',
      javascript: 'js',
      java: 'java',
    };

const submitCode= async (req,res)=> {

    try {
        const userId= req.result._id;
        const problemId= req.params.id;

        const {code, language} = req.body;

        if(!userId || !code || !problemId || !language) 
            return res.status(400).send("some field missing");

        const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).send('Problem not found');
    }
    const ext = extMap[language];
    if (!ext) {
      return res.status(400).send('Unsupported language');
    }
    const fileName = `index.${ext}`;

const allTestCases = [...problem.visibleTestCases, ...problem.hiddenTestCases];
    const totalTestCases = allTestCases.length;
        
        const submittedResult= await Submission.create( {
            userId,
            problemId,
            code,
            language,
            testCasesPassed:0,
            status: "pending",
            testCasesTotal: totalTestCases
        });

        
        let testCasesPassed=0;
        let runtime=0;
        let memory=0;
        let status= 'accepted';
        let errorMessage= null;
            const testResults = [];

        for(const test of allTestCases) {
            try {
        const response = await axios.post(
          'https://onecompiler-apis.p.rapidapi.com/api/v1/run',
          {
            language,
            stdin: test.input,
            files: [{ name: fileName, content: code }],
          },
          {
            headers: {
              'x-rapidapi-key': process.env.RAPIDAPI_KEY, 
              'x-rapidapi-host': 'onecompiler-apis.p.rapidapi.com',
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          }
        );

        const data = response.data;
        const stdout = data.stdout || '';
        const stderr = data.stderr || '';
        const executionTime = parseFloat(data.executionTime) || 0;
        const memoryUsed = parseInt(data.memoryUsed) || 0;

        const expected = test.output.trim();
        const actual = stdout.trim();
        const passed = data.status === 'success' && actual === expected;

        if (passed) {
          testCasesPassed++;
        } else {
          // Agar koi test fail ho, toh overall status change karo
          if (status === 'accepted') {
            if (data.status !== 'success' || stderr) {
              status = 'error';
              errorMessage = stderr || 'Execution error';
            } else {
              status = 'wrong';
              errorMessage = 'Output mismatch';
            }
          }
          // Pehla error message store karo
          if (!errorMessage) {
            errorMessage = stderr || (data.status !== 'success' ? 'Execution error' : 'Output mismatch');
          }
        }

        runtime += executionTime;
        if (memoryUsed > memory) memory = memoryUsed;

        testResults.push({
          passed,
          stdout: actual,
          stderr,
          executionTime,
          memory: memoryUsed,
          status: data.status,
        });
      } catch (err) {
        // Agar API call fail ho (network/timeout)
        if (status === 'accepted') status = 'error';
        if (!errorMessage) {
          errorMessage = err.message || 'Request failed';
        }
        testResults.push({
          passed: false,
          stdout: '',
          stderr: err.message,
          executionTime: 0,
          memory: 0,
          status: 'error',
        });
      }
        }

    //  Save result in database in submission

    submittedResult.status= status;
    submittedResult.runtime= runtime;
    submittedResult.memory= memory;
    submittedResult.errorMessage= errorMessage;
    submittedResult.testCasesPassed= testCasesPassed;

    await submittedResult.save();

    if (status === 'accepted') {
      if (!req.result.problemSolved.includes(problemId)) {
        req.result.problemSolved.push(problemId);
        await req.result.save();
      }
    }

    // 5. Response bhejo
    const accepted = status === 'accepted';
    res.status(201).json({
      accepted,
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory
    });


    }
    catch(err) {
        console.error(err);
        res.status(500).send("internal server error"+err);
    }

}


const runCode= async (req,res)=> {

    try {
        const userId= req.result._id;
        const problemId= req.params.id;

        const {code, language} = req.body;

        if(!userId || !code || !problemId || !language) 
            return res.status(400).send("some field missing");

        const problem= await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).send('Problem not found');
        }

        const ext = extMap[language];
        if (!ext) {
      return res.status(400).send('Unsupported language');
    }
    const fileName = `index.${ext}`;

         let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
     let overallStatus = true;
    const testResults = [];
    let errorMessage = null;

        for(const test of problem.visibleTestCases){
        try {
            console.log('Test input:', test.input, '| Type:', typeof test.input);
            const response= await axios.post('https://onecompiler-apis.p.rapidapi.com/api/v1/run', 
            {
                language,
                stdin: test.input,
                files: [
                    {
                        name: fileName,
                    content: code
                    }
                    ]
                },
                {
                headers: { 
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                    'x-rapidapi-host': 'onecompiler-apis.p.rapidapi.com',
                    'Content-Type': 'application/json'
                 },
                 timeout: 15000
            }
        );

        console.log('hi');
        const data = response.data;
        const stdout = data.stdout || '';
        const stderr = data.stderr || ''; // compilation/runtime error
        const executionTime = parseFloat(data.executionTime) || 0; // in seconds
        const memoryUsed = parseInt(data.memoryUsed) || 0;
      console.log(stdout);
        const expected = test.output.trim();
        const actual = stdout.trim();
        const passed = data.status === 'success' && actual === expected;

        if (passed) {
          testCasesPassed++;
        } else {
          overallStatus = false;
          // Capture first error message (if any)
          if (!errorMessage) {
            errorMessage = stderr || (data.status !== 'success' ? 'Execution error' : 'Output mismatch');
          }
        }

        runtime += executionTime;
        if (memoryUsed > memory) memory = memoryUsed;

         testResults.push({
          passed,
          stdout,
          stderr,
          executionTime,
          memory: memoryUsed,
          status: data.status,
        });
        }
        catch(err) {
            overallStatus = false;
        if (!errorMessage) {
          errorMessage = err.message || 'Request failed';
        }
        testResults.push({
          passed: false,
          stdout: '',
          stderr: err.message,
          executionTime: 0,
          memory: 0,
          status: 'error',
        });
        }
    }


    res.status(201).json({
     success: overallStatus,
      testCases: testResults,
      runtime: runtime, // total CPU time across all test cases
      memory: memory, // peak memory usage
      testCasesPassed, // if needed
      errorMessage, // first error encountered
    });
    }
    catch(err) {
        console.error(err);
        res.status(500).send("internal server error");
    }

}


module.exports= {submitCode, runCode};


//TestResult is sending me data like:
//  language_id: 54,
//  stdin: '2 3'
//  expected_output: '5',
//  status_id: 3,
//  created_at: 
//  finished _at:
//  time: 
//  stderr:
//  memory: 
//  token:
//  ....................... so on.... 
