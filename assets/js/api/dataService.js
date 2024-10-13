import config from '../config.js';

// ----- Create Instance ----- //
const apiRequest = axios.create({
  baseURL: config.apiUrl,
});

const apiRequestWithToken = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'authorization': config.token
  }
})

export const setToken = (newToken) => {
  apiRequestWithToken.defaults.headers['authorization'] = newToken;
};

// ----- API Request ----- //
export const get_signin = data => apiRequest.post('/users/sign_in', data);
export const get_signup = data => apiRequest.post('/users', data);
export const set_logout = () => apiRequestWithToken.delete('/users/sign_out');
export const check_account = () => apiRequestWithToken.get('/check');

// ----- API Request Authorization ----- //
export const get_todo = () => apiRequestWithToken.get('/todos');
export const del_todo = id => apiRequestWithToken.delete(`/todos/${id}`);
export const edit_todo = (id, todo) => apiRequestWithToken.put(`/todos/${id}`, todo);
export const add_todo = todo => apiRequestWithToken.post('/todos', todo);
export const set_todo_check = id => apiRequestWithToken.patch(`/todos/${id}/toggle`);