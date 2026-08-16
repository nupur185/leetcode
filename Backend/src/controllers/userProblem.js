const axios = require('axios');
const {getLanguageById,submitBatch,submitToken}= require('../utils/problemUtility');
const Problem= require("../models/problem");
const User = require("../models/user");
const Submission = require('../models/submission');
const solutionVideo= require('../models/solutionVideo');
const SolutionVideo = require('../models/solutionVideo');

const createProblem= async(req,res) => {
    const {title, description, difficulty, tags, visibleTestCases, hiddenTestCases, startCode, referenceSolution, problemCreator} = req.body;
    try {
            const extMap = {
      cpp: 'cpp',
      python: 'py',
      javascript: 'js',
      java: 'java',
      c: 'c',
    };
    const allTestCases = [...(visibleTestCases || []), ...(hiddenTestCases || [])];


        for(const {language, completeCode} of referenceSolution) {
             let lang = language.toLowerCase();
      if (lang === 'c++' || lang === 'cpp') {
        lang = 'cpp';
      }

            if (!extMap[lang]) {
                return res.status(400).send(`Unsupported language: ${language}`);
            }
            const ext = extMap[lang];
            const fileName = `index.${extMap[lang]}`;

        for (const testCase of allTestCases) {
        try {
            const stdin = testCase.input.replace(/\\n/g, '\n');
          const response = await axios.post(
            'https://onecompiler-apis.p.rapidapi.com/api/v1/run',
            {
              language:lang,
              stdin: testCase.input,
              files: [{ name: fileName, content: completeCode }],
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
           console.log(`stdout for ${language}:`, stdout); 

            if (data.status !== 'success' || stdout.trim() !== testCase.output.trim()) {
            const errorMsg = stderr || (data.status !== 'success' ? 'Execution error' : 'Output mismatch');
            // For hidden test cases, don't expose input in error (optional)
            const testInput = testCase.isHidden ? '(hidden)' : testCase.input;
            return res.status(400).send(
              `Reference solution failed for ${language} on test case: ${testInput}. ${errorMsg}`
            );
          }
        } catch (err) {
          return res.status(400).send(`Error running reference solution for ${language}: ${err.message}`);
        }
      }
    }

        const userProblem= await Problem.create({
            ...req.body,
            problemCreator: req.result._id   //admin id was stored in result, and then it was attached to req, when we were doing authentication
        });

        res.status(201).send("Problem Saved Successfully");
        
    }
    catch(err) {res.status(400).send("Error: "+err);}
}


const updateProblem= async(req,res) => {
    const {id} = req.params;
    const {title, description, difficulty, tags, visibleTestCases, hiddenTestCases, startCode, referenceSolution, problemCreator} = req.body;

    try {

        if(!id) {return res.status(400).send("Missing Id Field");}
        const DsaProblem= await Problem.findById(id);
        if(!DsaProblem) {
            return res.status(404).send("ID not present in Server");
        }

        for(const {language, completeCode} of referenceSolution) {
            const languageId= getLanguageById(language);

            const submissions= visibleTestCases.map((testcase)=> ({ 
                source_code: completeCode,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output
            }));

            const submitResult= await submitBatch(submissions);
            console.log(submitResult);

            const resultToken= submitResult.map((value)=> value.token); 
            const testResult= await submitToken(resultToken);

            console.log(testResult);

            for(const test of testResult) {
                if(test.status_id!=3) {
                    return res.status(400).send("Error occured");
                }
            }

        }

        const newProblem=  await Problem.findByIdAndUpdate(id, {...req.body}, {runValidators: true, new: true});  //new, to return new document after update
        res.status(200).send(newProblem);
    }
    catch(err) {
        res.status(500).send("Error: "+err);
    }
}


const deleteProblem= async(req,res) => {

    const {id} = req.params;
    try {

        if(!id) return res.status(400).send("Id missing");

        const deletedProblem= await Problem.findByIdAndDelete(id);
        if(!deletedProblem) 
            return res.status(404).send("Problem is missing");

        res.status(200).send("Successfully deleted");

    }
    catch(err) {
        res.status(500).send("Error: "+err);
    }

}


const getProblemById= async(req,res) => {

    const {id} = req.params;
    try {

        if(!id) return res.status(400).send("Id missing");

        const getProblem= await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution');

        if(!getProblem) 
            return res.status(404).send("Problem is missing");

        const videos = await SolutionVideo.findOne({problemId:id});

        if(videos) {
            const responseData= {
                ...getProblem.toObject(), 
                secureUrl: videos.secureUrl,
                thumbnailUrl: videos.thumbnailUrl,
                duration: videos.duration
            }
            return res.status(200).send(responseData);
        }

        res.status(200).send(getProblem);

    }
    catch(err) {
        res.status(500).send("Error: "+err);
    }

}

const getAllProblem= async(req,res) => {

    try {

        const getProblem= await Problem.find({}).select('_id title difficulty tags');
        if(getProblem.length==0) 
            return res.status(404).send("Problem is missing");

        res.status(200).send(getProblem);

    }
    catch(err) {
        res.status(500).send("Error: "+err);
    }

}


const solvedAllProblembyUser= async(req,res) => {
    try {
        // const count= req.result.problemSolved.length;
        // res.status(200).send(count);

        const userId= req.result._id;
        // const user= await User.findById(userId).populate("problemSolved");
        const user= await User.findById(userId).populate({
            path: "problemSolved",
            select: "_id title difficulty tags"
        });
        console.log("ok");
        res.status(200).send(user);
    }
    catch(err) {
        res.status(500).send("server error");
    }
}


const submittedProblem= async(req,res)=> {
    try {
        const userId= req.result._id;
        const problemId= req.params.pid;

        const ans= await Submission.find({userId, problemId});

        if(ans.length == 0) return res.status(200).json([]);

        res.status(200).send(ans);  
    }
    catch(err) {
        res.status(500).send("internal server error");
    }
}


module.exports= {createProblem,updateProblem, deleteProblem, getProblemById, getAllProblem,solvedAllProblembyUser, submittedProblem};

