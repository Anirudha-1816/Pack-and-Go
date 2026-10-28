import apiComponents from "../../apis/apiComponents";

export const getNav = async () => {
    
    const data = await apiComponents.get('/nav')
    return data.data.data
    
}

