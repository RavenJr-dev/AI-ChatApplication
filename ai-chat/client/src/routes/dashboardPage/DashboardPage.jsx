import { useMutation, useQueryClient } from '@tanstack/react-query';
import './dashboardPage.css';
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const { userId, getToken } = useAuth();

    const queryClient = useQueryClient()

    const navigate = useNavigate()

    const mutation = useMutation({
        mutationFn: async (text) => {
          const token = await getToken();
          return fetch(`${import.meta.env.VITE_API_URL}/api/chats`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ text }),
          }).then((res) => res.json());
        },
        onSuccess: (id) => {
          queryClient.invalidateQueries({ queryKey: ["userChats"] });
          navigate(`/dashboard/chats/${id}`);
          console.log("Chat created with ID:", id);
        },
      });
      
    const handleSubmit = async (e) => {
        e.preventDefault();
         const text = e.target.text.value.trim();
        if ( !text) return;
        mutation.mutate(text);

        console.log(" Submitting new chat to backend...", text);

        
    };

    return (
        <div className='dashboardPage'> 
            <div className="texts">
                <div className="logo">
                    <img src="/logo.png" alt=""/>
                    <h1> DEV CHAT-AI </h1>
                </div>

                <div className="options">
                    <div className="optionItem">
                        <img src="/chat.png" alt="Chat" />
                        <span>Create a New Chat</span>
                    </div>
                    <div className="optionItem">
                        <img src="/image.png" alt="Image" />
                        <span>Analyze Images</span>
                    </div>
                    <div className="optionItem">
                        <img src="/code.png" alt="Code" />
                        <span>Help me with my Code</span>
                    </div>
                </div>
            </div>

            <div className="formContainer">
                <form onSubmit={handleSubmit}>
                    <input type="text" name="text" placeholder="Ask me anything..." autoComplete="off"/>
                    <button>
                        <img src="/arrow.png" alt="" />
                    </button>
                </form>
            </div>
        </div>
    );
}

export default DashboardPage
