"use client";

import Image from "next/image";
import Vapi from "@vapi-ai/web";
import { useEffect, useState } from "react";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { faHeadphones } from "@fortawesome/free-solid-svg-icons";

// Get public key from .env
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

// choose mic
// pick name

export default function Home() {
  const [name, setName] = useState("");
  const [statement, setStatement] = useState("");
  const callStates = ["none", "calling", "connected", "finished"];
  const [callState, setCallState] = useState("none");
  const [time, setTime] = useState(0);
  const [questionStarted, setQuestionStarted] = useState(null);
  const [questionTime, setQuestionTime] = useState(0);

  // Used for showing
  const [partialQuestion, setPartialQuestion] = useState<{
    role: string;
    content: string;
  }>();
  const [partialAnswer, setPartialAnswer] = useState<{
    role: string;
    content: string;
  }>();

  const [finalQuestion, setFinalQuestion] = useState<"">();
  const [finalAnswer, setFinalAnswer] = useState<"">();
  const [showPartialTranscript, setShowPartialTranscript] = useState(true);

  const [transcript, setTranscript] = useState<
    { role: string; content: string }[]
  >([]);
  const [showTranscript, setShowTranscript] = useState(false);

  // Update the timer display every second
  useEffect(() => {
    let intervalId = null;
    const interruptionTime = Math.floor(Math.random() * 6) + 10; // Random time between 15-20s

    if (questionStarted) {
      intervalId = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - questionStarted) / 1000);
        setQuestionTime(elapsed);
        if (elapsed >= 1) {
          console.log(elapsed);

          console.log(
            vapi.send({
              type: "add-message",
              message: {
                role: "tool",
                content:
                  "The user has spent too long answering the question. Interrupt the conversation.",
              },
            })
          );
          // vapi.setMuted(true);
        }
      }, 1000);
    }

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, [questionStarted]);

  useEffect(() => {
    if (callState === "connected") {
      const timer = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [callState]);

  useEffect(() => {
    vapi.on("speech-end", () => {
      if (callState === "calling") {
        setCallState("connected");
      }
      setQuestionStarted(new Date());
      if (vapi.isMuted()) {
        vapi.setMuted(false);
      }
    });

    vapi.on("speech-start", () => {
      if (callState === "calling") {
        setCallState("connected");
      }

      setQuestionStarted(null);
      setQuestionTime(0);
      setFinalQuestion("");
      setFinalAnswer("");
      setPartialQuestion(null);
      setPartialAnswer(null);
    });

    vapi.on("call-start", () => {
      setCallState("connected");
    });

    vapi.on("call-end", () => {
      setCallState("finished");
      setQuestionStarted(null);
      setQuestionTime(0);
      setFinalQuestion("");
      setFinalAnswer("");
      setPartialQuestion(null);
      setPartialAnswer(null);
    });

    vapi.on("message", (message) => {
      if (message.type === "conversation-update") {
        setTranscript(message.conversation);
      }

      if (message.type === "transcript") {
        if (message.transcriptType === "partial") {
          if (message.role === "assistant") {
            setPartialQuestion({
              role: message.role,
              content: finalQuestion
                ? finalQuestion + " " + message.transcript
                : message.transcript,
            });
          } else {
            setPartialAnswer({
              role: message.role,
              content: finalAnswer
                ? finalAnswer + " " + message.transcript
                : message.transcript,
            });
          }
        } else if (message.transcriptType === "final") {
          if (message.role === "assistant") {
            setFinalQuestion(message.transcript);
            setPartialQuestion({
              role: message.role,
              content: finalQuestion
                ? finalQuestion + " " + message.transcript
                : message.transcript,
            });
          } else {
            setFinalAnswer(message.transcript);
            setPartialAnswer({
              role: message.role,
              content: finalAnswer
                ? finalAnswer + " " + message.transcript
                : message.transcript,
            });
          }
        }
      }
    });
  }, []);

  const assistantOptions: CreateAssistantDTO = {
    name: "YC Interview Executive Assistant",
    firstMessage: name ? `What does ${name} do?` : "What do you do?",
    numWordsToInterruptAssistant: 10,
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US",
    },
    // voice: {
    //   provider: "playht",
    //   voiceId: "jennifer",
    // },
    voice: {
      provider: "11labs",
      voiceId: "5v8WYXwPfkcp3o7efDZt", // Dalton
    },
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an interviewer for YCombinator, the world's best start-up accelerator. You are directly responsible for deciding if a company should receive $500,000 in funding. There are thousands of companies interviewing and you will only accept 100.

        Your job is to ask questions to identify what the company does, how much traction there is, who the team is, and why they're capable of building a billion dollar company. 

        Start the conversation by asking "what does ${name} do?".

  There are several types of questions you should ask in your interview. Here are the themes: 

  Product and Market Fit
  Technical Aspects
  Business Strategy and Model
  Team Dynamics and Execution
  Challenges and Risks
  Metrics and Performance
  
  And here are some examples. Do not ask the same question twice.

  What do you understand that others don't?
  Why will you succeed?
  How big an opportunity is there?
  What problems/hurdles are you anticipating?
  Who would use your product?
  How much does customer acquisition cost?
  How will you make money?
  How much money could you make per year?
  How many users do you have?
  What is your user growth rate?
  How many users are paying?
  How are you meeting customers?
  How are you understanding customer needs?
  How will you get users?
  Who would you hire or how would you add to your team?
  So what are you working on?
  Do you have a demo?
  Where is the rocket science here?
  How does your product work in more detail?
  How is your product different?
  What are you going to do next?
  What's new about what you make?
  What, exactly, makes you different from existing options?
  Who needs what you're making?
  How do you know customers need what you're making?
  Why isn't someone already doing this?
  What obstacles will you face and how will you overcome them?
  How will customers and/or users find out about you?
  What resistance will they have to trying you and how will you overcome it?
  What are the key things about your field that outsiders don't understand?
  What part of your project are you going to build first?
  Who is going to be your first paying customer?
  If your startup succeeds, what additional areas might you be able to expand into?
  Why did you choose this idea?
  What have you learned so far from working on your product?
  Six months from now, what's going to be your biggest problem?
  Where do new users come from?
  What is your growth like?
  What's the conversion rate?
  What makes new users try you?
  Why do the reluctant users hold back?
  What are the top things users want?
  What has surprised you about user behaviour?
  What's an impressive thing you have done?
  What do you understand about your users?
  Why did you pick this idea to work on?
  What domain expertise do you have?
  Who are your competitors?
  Who might become competitors?
  Someone just showed us an idea like this right before you guys. I don't like it. What else do you have?
  What competition do you fear most?
  What is your distribution strategy?
  How did your team meet?
  Why did your team get together?
  Who in your team does what?
  Who is "the boss"?
  What will you do if we don't fund you?
  Would you relocate to Silicon Valley?
  How do we know your team will stick together?
  What else have you created together?
  Are you open to changing your idea?
  What systems have you hacked?
  Tell us about a tough problem you solved?
  In what ways are you resourceful?
  Will you reincorporate as a US company?
  Will your team stick at this?
  Tell us something surprising you have done?
  What's the funniest thing that has happened to you?
  What's the worst thing that has happened?
  What's the biggest mistake you have made?
  What is your burn rate?
  How long can you go before funding?
  What is the next step with the product evolution?
  Have you raised funding?
  Who would be your next hire?
  How do you know people want this?
  What do you know about this space/product others don't know?

  When possible ask these questions and reference the description of their company ${statement}. Don't overly rely on this, but make it useful. 
  

  Evaluate each user's answers based on the below:

  Brevity and Clarity: Check if the answer is direct and concise, ideally within 2-3 sentences without unnecessary details.
  Relevance and Substance: Ensure the response is directly relevant to the query and provides substantial information without vague or generic statements.
  Confidence and Precision: Look for precise language and a confident tone, avoiding filler words like "um" or "uh."
  Pacing: Assess whether the response matches the quick conversational tempo typical in high-energy business discussions like those at Y Combinator.
  

  Here are other tips you should follow when conducting the interview:

    - The best way to evaluate companies is to use the individuals response, and ask a follow-up question after their answer. Try to do this as often as possible.
    - Occasionally, briefly summarize a users response to make sure you heard it clearly. 
    - Be sure to be intelligent and ask precise questions about the company!
    - Ask one follow-up question after each answer. Especially when it's unclear.
    - Interrupt when the candidate is rambling or going off-topic. Answers should not be longer than 10s. 
    - Keep all your responses short and simple. Use specific language, but simple vocabulary. 
    - This is an interview, so keep your responses and questions very short, like in a real conversation. Don't ramble at all.`,
        },
      ],
    },
  };

  const questionMinutes = Math.floor(questionTime / 60);
  const questionSeconds = questionTime % 60;

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  useEffect(() => {
    if (minutes >= 10) {
      vapi.stop();
      setCallState("finished");
      setTime(0);
      setQuestionTime(0);
      window.alert("Time's up. Interview time exceeded 10 minutes");
    }
  }, [minutes]);

  const handleStart = async () => {
    // eslint-disable-next-line
    vapi.start(assistantOptions);
    setCallState("calling");
    setTimeout(() => {
      if (callState === "calling") {
        setCallState("none");
        window.alert("Call failed");
      }
    }, 5000);
  };

  const handleEnd = () => {
    vapi.stop();
    setCallState("finished");
  };

  const cannotEdit = callState === "calling" || callState === "connected";

  return (
    <main>
      <div className='flex min-h-screen flex-col items-center justify-center bg-slate-100 p-24'>
        <div className='mb-8 text-center flex flex-col place-items-center'>
          <div className='text-slate-800 font-bold text-4xl'>Mock YC</div>
          <div className='text-slate-400 text-sm'>
            A voice-based interview tool
          </div>
          <br />
          <div className='text-slate-400 text-xs max-w-72'>
            Input company details. AI will customize your interview.
          </div>
        </div>

        <div className='flex flex-col w-56'>
          <div className='mb-4'>
            <label
              className='block text-gray-700 text-sm font-bold mb-2'
              htmlFor='name'
            >
              Company Name
            </label>
            <input
              className={`shadow text-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition-colors duration-200 ease-in-out ${
                cannotEdit ? "opacity-50" : ""
              }`}
              id='name'
              type='text'
              placeholder='company name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={cannotEdit}
            />
          </div>
          <div className='mb-4'>
            <label
              className='block text-gray-700 text-sm font-bold mb-2'
              htmlFor='statement'
            >
              What do you do?
            </label>
            <textarea
              className={`shadow text-sm appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none w-full focus:shadow-outline transition-colors duration-200 ease-in-out ${
                cannotEdit ? "opacity-50" : ""
              }`}
              id='statement'
              placeholder='reject yc companies'
              maxLength={50}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              disabled={cannotEdit}
            />
            <div className='relative float-right text-gray-400'>
              <p className='text-xs'>{50 - statement.length}/50</p>
            </div>
          </div>
        </div>
        {callState === "none" && (
          <div className='text-center flex flex-col place-items-center'>
            <div className='text-slate-400 text-center text-xs max-w-72'>
              On start, AI asks questions via mic/speakers. Transcript available
              post-call.
              <br />
              <br />
            </div>
            <div
              onClick={handleStart}
              className='bg-[#F26522] text-white p-3 font-bold hover:bg-[#f57a22eb] transition-colors duration-200 w-fit'
            >
              Start Interview
            </div>
          </div>
        )}
        {callState === "calling" && (
          <div className='bg-[#F26522] text-white p-3 font-bold transition-colors duration-200 animate-pulse'>
            Calling...
          </div>
        )}
        {callState === "connected" ? (
          <div className='flex mb-4 gap-4'>
            <div
              className={`flex flex-col place-content-center justify-center text-center border p-2 rounded-md transition-colors duration-500 ${
                questionSeconds > 9 && questionSeconds % 2 === 0
                  ? "bg-orange-400"
                  : "bg-slate-200"
              }`}
            >
              <div className='text-5xl text-slate-700'>
                {questionMinutes}:
                {questionSeconds < 10 ? `0${questionSeconds}` : questionSeconds}
              </div>
              <p className='text-slate-400 text-sm'>Question time</p>
            </div>
            <div
              className={`flex flex-col place-content-center justify-center text-center border p-2 rounded-md bg-slate-200
              }`}
            >
              <div className='text-5xl text-slate-700'>
                {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
              </div>
              <p className='text-slate-400 text-sm'>Interview time</p>
            </div>
          </div>
        ) : null}
        {callState === "connected" && (
          <div>
            <div className=' text-slate-500 p-3 text-center font-medium '>
              Interview in progress
            </div>
            <div
              onClick={handleEnd}
              className='bg-[#F26522] text-white p-3 font-bold hover:bg-[#f57a22eb] transition-colors duration-200 text-center'
            >
              End call
            </div>
            <div className='flex flex-col place-items-center gap-2 m-2'>
              <ConnectedInput />
              <ConnectedOutput />
            </div>
          </div>
        )}
        {callState === "finished" && (
          <>
            <div className=' text-[#F26522] p-3 font-bold transition-colors duration-200'>
              Interview finished
            </div>
            <div className='flex gap-4'>
              <div
                onClick={handleStart}
                className='bg-[#F26522] text-white p-3 font-bold hover:bg-[#f57a22eb] transition-colors duration-200'
              >
                Start over
              </div>
              <div
                onClick={() => {
                  setShowTranscript(!showTranscript);
                }}
                className='bg-slate-800 text-white p-3 font-bold hover:bg-slate-500 transition-colors duration-200'
              >
                Show Full Transcript
              </div>
            </div>
          </>
        )}
        <div className='text-slate-400 text-center text-sm m-4 hover:text-slate-600 hover:underline cursor-pointer'>
          <a href='https://www.ycombinator.com/interviews'>
            Read YC&apos;s official interview guide
          </a>
        </div>

        {showTranscript ? (
          <div>
            {transcript.map((message, index) => (
              <TranscriptLine
                key={index}
                message={message}
                name={name ? name : "You"}
              />
            ))}
          </div>
        ) : null}
        {showPartialTranscript && callState === "connected" ? (
          <div>
            {[partialQuestion, partialAnswer].map((message, index) => {
              return (
                <TranscriptLine
                  key={index}
                  message={message}
                  name={name ? name : "You"}
                />
              );
            })}
          </div>
        ) : null}
      </div>
      <div className='h-12 flex items-center justify-center bg-gray-200 text-gray-700'>
        <div className='text-slate-400 text-center text-sm m-4 '>
          Created for fun by{" "}
          <a
            className='hover:text-slate-600 text-slate-500 hover:underline cursor-pointer'
            href='https://twitter.com/rob_olsthoorn'
          >
            Rob Olsthoorn
          </a>{" "}
          and heavily inspired by{" "}
          <a
            className='hover:text-slate-600 text-slate-500 hover:underline cursor-pointer'
            href='https://jamescun.github.io/iPG'
          >
            James Cunningham
          </a>
        </div>
      </div>
    </main>
  );
}

const TranscriptLine = ({ index = 0, name = "You", message }) => {
  if (!message) return null;
  return (
    <div key={index} className='text-sm text-slate-500'>
      <b className='text-slate-800'>
        {message.role === "assistant" ? "Interviewer" : name}:
      </b>{" "}
      {message.content}
      <br />
    </div>
  );
};

const ConnectedInput = () => {
  const [devices, setDevices] = useState([]);

  const [currentDeviceName, setCurrentDeviceName] = useState("");

  useEffect(() => {
    const getDevices = async () => {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const mics = mediaDevices.filter(
        (device) => device.kind === "audioinput"
      );
      setDevices(mics);
      if (mics.length > 0) {
        setCurrentDeviceName(mics[0].label); // Set initial mic name
      }
    };

    getDevices();
  }, []);

  return (
    <div className='h-4 gap-1 text-slate-300 flex justify-center place-content-center place-items-center'>
      <FontAwesomeIcon icon={faMicrophone} /> <div>{currentDeviceName}</div>
    </div>
  );
};

const ConnectedOutput = () => {
  const [devices, setDevices] = useState([]);

  const [currentDeviceName, setCurrentDeviceName] = useState("");

  useEffect(() => {
    const getDevices = async () => {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const speakers = mediaDevices.filter(
        (device) => device.kind === "audiooutput"
      );
      setDevices(speakers);
      if (speakers.length > 0) {
        setCurrentDeviceName(speakers[0].label); // Set initial speaker name
      }
    };

    getDevices();
  }, []);

  return (
    <div className='h-4 gap-1 text-slate-300 flex justify-center place-content-center place-items-center'>
      <FontAwesomeIcon icon={faHeadphones} /> <div>{currentDeviceName}</div>
    </div>
  );
};
