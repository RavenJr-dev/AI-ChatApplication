import { useEffect, useRef, useState } from 'react';
import './newPrompt.css'
import Upload from '../upload/Upload';
import { IKImage } from 'imagekitio-react';
import model from '../../lib/gemini';
import Markdown from "react-markdown";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';

const NewPrompt = ({data}) => {
    const [question, setQuestion] = useState("")
    const [answer, setAnswer] = useState("")
    const [img, setImg] =useState({
        isLoading: false,
        error:"",
        dbData:{},
        aiData:{}
    });

    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: "Hello, I have 2 dogs in my house."}],
            },
            {
                role: "model",
                parts: [{ text: "Great to meet you. What would you like to know?"}],
            },
        ],
        generationConfig: {
            //maxOutputTokens: 100,
        },
    });

    const endRef = useRef(null);
    const formRef = useRef(null);

    useEffect(()=>{
        endRef.current.scrollIntoView({behavior:"smooth"});
    }, [question, answer,img.dbData]);

    const { userId, getToken } = useAuth();
    
        const queryClient = useQueryClient()
    
        const mutation = useMutation({
            mutationFn: async ({ finalAnswer }) => {
                const token = await getToken();
                return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        question: question.length ? question : undefined,
                        answer: finalAnswer,
                        img: img.dbData?.filePath || undefined,
                    }),
                }).then((res) => res.json());
            },
            onSuccess: () => {
              queryClient
              .invalidateQueries({ queryKey: ["chat", data._id] })
              .then(() => {
                formRef.current.reset()
                setQuestion("")
                setAnswer("")
                setImg({
                    isLoading: false,
                    error:"",
                    dbData:{},
                    aiData:{}
                })
              });
            },
            onError: (err) => {
                console.log(err);
            },
          });

          const add = async (text , isInitial) => {
            if (!isInitial) setQuestion(text);
            try {
                const result = await chat.sendMessageStream(
                    Object.entries(img.aiData).length ? [img.aiData, text] : [text]
                );
        
                let accumulatedText = "";
                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    accumulatedText += chunkText;
                    setAnswer(accumulatedText); // keep UI updated
                }
        
                // NOW call mutation AFTER the full answer is collected
                setAnswer(accumulatedText);
                mutation.mutate({
                    finalAnswer: accumulatedText // pass explicitly
                });
        
            } catch (err) {
                console.log(err);
            }
        };
        
    

    const handleSubmit = async (e)=>{
        e.preventDefault()

        const text = e.target.text.value;
        if (!text) return;

        add(text, false);

        
    };

    //IN PRODUCTION WE DON'T NEED IT
    const hasRun = useRef(false)

    useEffect(() =>{
        if(!hasRun.current){
            if(data?.history?.length === 1) {
                add(data.history[0].parts[0].text, true);
        }
        }
        hasRun.current = true;
    }, []);

    return (
        <>
        {/* ADD NEW CHAT */}
        {img.isLoading && <div className=''>Loading...</div>}
        {img.dbData?.filePath && (
            <IKImage
            urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
            path={img.dbData?.filePath}
            width="380"
            transformation={[{ width: 380 }]}
        />
        )}
        {question && <div className='message user'>{question}</div>}
        {answer && (
            <div className='messag'>
            <Markdown>{answer}</Markdown>
            </div>
        )}
        <div className="endChat" ref={endRef}></div>
            <form className="newForm" onSubmit={handleSubmit} ref={formRef}>
                <Upload  setImg={setImg}/>
                <input id="file" type="file" multiple={false} hidden/>
                <input type="text" name="text"placeholder="Ask anything..." autoComplete="off"/>
                <button>
                    <img src="/arrow.png" alt="" />
                </button>
            </form>
        </>
    )
}

export default NewPrompt