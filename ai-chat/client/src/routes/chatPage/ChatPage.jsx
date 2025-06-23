import './chatPage.css'
import { useEffect } from 'react'
import NewPrompt from '../../components/newPrompt/NewPrompt'
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import Markdown from 'react-markdown';
import { IKImage } from 'imagekitio-react';

const ChatPage = () => {

        const path = useLocation().pathname
        const chatId = path.split("/").pop()

        const { getToken } = useAuth();
  
        const { isPending, error, data } = useQuery({
            queryKey: ["chat", chatId],
            queryFn: async () => {
              const token = await getToken();
              const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, {
                credentials: "include",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
          
              console.log("Fetch response:", res.status);
              const result = await res.json();
              console.log("Result:", result);
          
              if (!res.ok) {
                throw new Error(`Fetch failed: ${res.status} - ${result}`);
              }
          
              return result;
            },
          });
          
          return (
            <div className='chatPage'>
                <div className="wrapper">
                    <div className="chat">
                        { isPending 
                            ? "Loading..."
                            : error
                            ? "Something went wrong!"
                            : data?.history?.map((message, i) => (
                                <>
                                {message.img && (
                                    <IKImage
                                        urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
                                        path={message.img}
                                        height="300"
                                        width="400"
                                        transformation={[{height:300, width:400}]}
                                        lqip={{active:true, quality:20}}
                                    />
                                )}
                                
                            <div className={message.role === "user" ? "message user" : "message"} key={i}> 
                                <Markdown>{message?.parts?.[0]?.text || ""}</Markdown>
                            </div>
                            </>
                        ))}
                        
                        {data && <NewPrompt data={data}/>}
                     
                        
                    </div>
                </div>
            </div>
        );
    };
    
    export default ChatPage
    