import { useState} from "react";
import { useAuth } from "../hooks/useAuth";

const Login = () => {

  const [input, setInput] = useState({
    username: "",
    password: "",
  });
  const [errMessage, setMessage] = useState<any>('');
  const auth = useAuth();

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.username !== "" && input.password !== "") {
        let res: any = await auth.login(input);
        if(!res)
          setMessage('Неверный логин или пароль');
      return;
    }
    
    alert("please provide a valid input");
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement >) => {
    const { name, value } = e.target;
    setInput((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmitEvent}>
     <div className="form_control">
      <div className="min-h-screen bg-gray-100 text-gray-900 flex justify-center">
    <div className="max-w-screen-xl m-0 sm:m-10 bg-white shadow sm:rounded-lg flex justify-center flex-1">
        <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-12">
            <div className="mt-12 flex flex-col items-center">
                <h1 className="text-2xl xl:text-3xl font-extrabold">
                    Sign In
                </h1>
                
                <div className="w-full flex-1 mt-8">

                   <div className="mx-auto max-w-xs">
                        <input
                           className="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                           type="text" 
                           placeholder="логин"
                           id="username"
                           name="username"
                           onChange={handleInput}
                          />
                            <div id="username" className="sr-only">
                              Пожалуйста, введите корректное имя. Оно должно содержать не менее 6 символов
                            </div>
                        <input
                            className="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white mt-5"
                            type="password"
                            placeholder="Password" 
                            id="password"
                            name="password"
                            onChange={handleInput}
                            />
                        <div id="user-password" className="sr-only">
                          Ваш пароль должен содержать не менее 6 символов
                        </div>
                        <button
                            className="mt-5 tracking-wide font-semibold bg-green-500 text-gray-100 w-full py-4 rounded-lg hover:bg-green-700 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                            </svg>

                            <span className="ml-3">
                                Sign In
                            </span>
                        </button>
                        <div>{errMessage}</div>
                    </div>
                    
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
            </form>

      
  );
};

export default Login;