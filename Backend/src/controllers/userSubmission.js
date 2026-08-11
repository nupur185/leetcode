const Problem= require("../models/problem");
const Submission= require("../models/submission");
const User= require("../models/user");
const {getLanguageById,submitBatch,submitToken}= require("../utils/problemUtility");

const submitCode= async (req,res)=> {

    try {
        const userId= req.result._id;
        const problemId= req.params.id;

        const {code, language} = req.body;

        if(!userId || !code || !problemId || !language) 
            return res.status(400).send("some field missing");

         if(language==='cpp') language='c++'

        //fetch problem from database
        const problem= await Problem.findById(problemId);
        //hidden Test Case 

        //firstly store the submissions in db
        // console.log("ok");
        const submittedResult= await Submission.create( {
            userId,
            problemId,
            code,
            language,
            testCasesPassed:0,
            status: "pending",
            testCasesTotal: problem.hiddenTestCases.length
        })
        // console.log("ok");

    //   Now, submit code to judge0
        const languageId= getLanguageById(language);
        const submissions= Problem.hiddenTestCases.map((testcase)=> ({
                source_code: code,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output
            }));
        const submitResult= await submitBatch(submissions);
        const resultToken= submitResult.map((value)=> value.token); 
        const testResult= await submitToken(resultToken);

        //UPDATE SUBMITTED RESULT
        let testCasesPassed=0;
        let runtime=0;
        let memory=0;
        let status= 'accepted';
        let errorMessage= null;

        for(const test of testResult) {
            if(test.status_id==3) {
                testCasesPassed++;
                runtime= runtime+parseFloat(test.time);
                memory=Math.max(memory,test.memory);
            }
            else {
                if(test.status_id==4) {
                    status= 'error';
                    errorMessage= test.stderr;
                }
                else {
                    status= 'wrong';
                    errorMessage= test.stderr;
                }
            }
        }

    //  Save result in database in submission

    submittedResult.status= status;
    submittedResult.runtime= runtime;
    submittedResult.memory= memory;
    submittedResult.errorMessage= errorMessage;
    submittedResult.testCasesPassed= testCasesPassed;

    await submittedResult.save();

    //check it that problemid present in totalproblemsolved by user or not, if not, then insert
    if(!req.result.problemSolved.includes(problemId)) {
        req.result.problemSolved.push(problemId);   //isse sirf push changes apne local (like ram) me hua h
        await req.result.save();                    // isse ab permanently db me store ho jayega0
    }

    const accepted = (status == 'accepted')
    res.status(201).json({
      accepted,
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory
    });


    }
    catch(err) {
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
        if(language==='cpp') language='c++'

    //   Now, submit code to judge0
        const languageId= getLanguageById(language);
        const submissions= Problem.visibleTestCases.map((testcase)=> ({
                source_code: code,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output
            }));
        const submitResult= await submitBatch(submissions);
        const resultToken= submitResult.map((value)=> value.token); 
        const testResult= await submitToken(resultToken);

         let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = true;
    let errorMessage = null;

    for(const test of testResult){
        if(test.status_id==3){
           testCasesPassed++;
           runtime = runtime+parseFloat(test.time)
           memory = Math.max(memory,test.memory);
        }else{
          if(test.status_id==4){
            status = false
            errorMessage = test.stderr
          }
          else{
            status = false
            errorMessage = test.stderr
          }
        }
    }

    res.status(201).json({
    success:status,
    testCases: testResult,
    runtime,
    memory
    });
    }
    catch(err) {
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
