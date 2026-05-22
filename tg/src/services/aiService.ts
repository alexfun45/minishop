import {apiClient} from '../services/api'

class AiService{

  async handleUserMessage(userId: number, message: string){
    return apiClient.sendAi(userId, message);
  } 

}

const aiService = new AiService();

export {aiService}