import { Link } from 'react-router-dom'
import './chatList.css'
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@clerk/clerk-react";

const ChatList = () => {
  const { getToken } = useAuth();
  
  const { isPending, error, data } = useQuery({
    queryKey: ["userChats"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/userchats`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Fetch failed: ${res.status} - ${errText}`);
      }
  
      return res.json();
    },
  });
  
  


    return (
        <div className='chatList'>
            <div className="scrollArea">
            <span className='title'> DASHBOARD </span>
            <Link to="/dashboard"> Create a New Chat </Link>
            <Link to="/"> Explore Dev Chat-AI </Link>
            <Link to="/"> Contact </Link>
            <hr/>
            <span className='title'> RECENT CHATS </span>
            <div className="list">
                {isPending 
                    ? "Loading..." 
                    : error 
                    ? "Something went wrong!" 
                    : data?.map(chat=>(
                    <Link to={`/dashboard/chats/${chat._id}`} key={chat._id}> 
                        {chat.title}
                    </Link>
                ))}
            </div>
            <hr/>
            </div>
            <div className="upgrade">
                <img src="/logo.png" alt=" "/>
                <div className="texts">
                    <span>Upgrade to Dev Chat-AI Pro </span>
                    <span> Get Unlimited access  </span>
                </div>
            </div>
        </div>
    );
};

export default ChatList;