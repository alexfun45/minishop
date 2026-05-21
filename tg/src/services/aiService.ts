import {apiClient} from '../services/api'

class AiService{

  async handleUserMessage(userId: number, message: string){
    //return apiClient.sendAi();
  } 

}

const aiService = new AiService();

export {aiService}