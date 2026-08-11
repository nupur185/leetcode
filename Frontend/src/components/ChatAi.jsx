// import { useForm } from "react-hook-form";
// import { Send } from 'lucide-react';

// const ChatAi= ()=> {

//     const {register, handleSubmit} = useForm();

//     const onSubmit= (data) => {
//         console.log(data);
//     }
//     return (
//         <>
//             <div className="chat chat-start">
//             <div className="chat-bubble">
//             It's over Anakin,
//             <br />
//             I have the high ground.
//             </div>
//             </div>
//             <div className="chat chat-end">
//             <div className="chat-bubble">You underestimate my power!</div>
//             </div>

//             <form onSubmit={handleSubmit(onSubmit)} className="form-control flex justify-center">
//                 <input {...register("message", {required:true, minLength:2})} className="input input-bordered w-[80%]"></input>
//                 <button type="submit" className="ml-2 mt-2">
//                     <Send />
//                 </button>
//             </form>
//         </>
//     )
// }

// export default ChatAi;



































import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send } from 'lucide-react';

function ChatAi({problem}) {
    const [messages, setMessages] = useState([
        { role: 'model', parts:[{text: "Hi, How are you"}]},
        { role: 'user', parts:[{text: "I am Good"}]}
    ]);

    const { register, handleSubmit, reset,formState: {errors} } = useForm();    //reset is used in useForm() to clear after submit
    const messagesEndRef = useRef(null);    //messagesEndRef is handling scroll to recent lines

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const onSubmit = async (data) => {
        // setMessages(prev => [...prev, { role: 'user', parts:[{text: data.message}] }]);
        const userMessage = { role: 'user', parts: [{ text: data.message }] };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        reset();

        try {
            
            const response = await axiosClient.post("/ai/chat", {
                messages: updatedMessages,
                title: problem.title,
                description: problem.description,
                testCases: problem.visibleTestCases,
                startCode: problem.startCode
            });

           
            setMessages(prev => [...prev, { 
                role: 'model', 
                parts:[{text: response.data.message}]
            }]);
        } catch (error) {
            console.error("API Error:", error);
            setMessages(prev => [...prev, { 
                role: 'model', 
                parts:[{text: "Error from AI Chatbot"}]
            }]);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-[80vh] min-h-[500px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
                    >
                        <div className="chat-bubble bg-base-200 text-base-content">
                            {msg.parts[0].text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form 
                onSubmit={handleSubmit(onSubmit)} 
                className="sticky bottom-0 p-4 bg-base-100 border-t"
            >
                <div className="flex items-center">
                    <input 
                        placeholder="Ask me anything" 
                        className="input input-bordered flex-1" 
                        {...register("message", { required: true, minLength: 2 })}
                    />
                    <button 
                        type="submit" 
                        className="btn btn-ghost ml-2"
                        disabled={errors.message}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ChatAi;