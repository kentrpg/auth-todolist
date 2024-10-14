import { get_todo, add_todo, del_todo, edit_todo, set_todo_check, set_logout, check_account } from './api/dataService.js';
import Storage from './storage.js';

/* ----- Setup  ----- */
// let todoData = [];
let userData = {};
let activeTodosCount = 0;
let currentFilter = Storage.get('todosStatus') || 'allTodos';
const todoList = document.querySelector('.todo-list-ul');

// for updateTodosCount()
const todosCount = document.querySelector('.todos-count');
const todosStatus = document.getElementById('todosStatus');

// for handleTodoList()
const todoListWrapper = document.querySelector('.todo-list-wrapper');
const todoListEmpty = document.querySelector('.todo-list-empty');

async function fetchTodos() {
  try {
    const response = await get_todo();
    console.log(response.data.todos);
    // setTodoData(response.data.todos);
    // console.log(todoData);
    return response.data.todos;
  } catch (error) {
    console.error('獲取待辦事項時出錯：', error);
    await Swal.fire('獲取待辦事項失敗', error.message, 'error');
    return [];
  }
}

async function getStorage() {
  userData = {...userData,
    nickname: Storage.get('nickname'),
    todosStatus: Storage.get('todosStatus')
  }
}

function delegateEvent(event) {
  const eventHandlersByClass = {
    'option-input': handleCheckboxEvent,
    'input': handleInputValueEvent,
    'delete': handleDeleteEvent
  };
  const todoItem = event.target.closest('.todo-list-item');
  const className = event.target.className;
  if (!todoItem || !eventHandlersByClass.hasOwnProperty(className)) return;
  console.log('delegateEvent', event, todoList, todoItem, className, activeTodosCount);
  eventHandlersByClass[className](event, todoList, todoItem);
}

function hasPseudoElement(element, pseudo) {
  const style = window.getComputedStyle(element, pseudo);
  return style.content !== 'none' && style.content !== '';
}

async function handleCheckboxEvent(event, todoList, todoItem) {
  // console.log('handleCheckboxEvent',event, todoList, todoItem);
  const todoId = todoItem.dataset.id;

  try {
    if (currentFilter !== 'allTodos') {
      console.log(currentFilter);
      handleTodoStatusChange(event, todoItem);
      updateTodosCount(activeTodosCount);
    };
    await set_todo_check(todoId);  
  } catch (error) {
    await showErrorMessage('更新待辦事項狀態', error);
  }
}

function handleTodoStatusChange(event, todoItem) {
  const todoActions = {
    allTodos: {
      // complete: () => { activeTodosCount--; },
      // uncomplete: () => { activeTodosCount++; }
    },
    activeTodos: {
      complete: (todoItem) => { 
        activeTodosCount--; 
        todoItem.remove();
      },
      uncomplete: () => { activeTodosCount++; }
    },
    completedTodos: {
      complete: () => {},
      uncomplete: (todoItem) => { 
        activeTodosCount--; 
        todoItem.remove();
      }
    }
  };
  const isCompleted = hasPseudoElement(event.target, '::before');
  const action = isCompleted ? 'complete' : 'uncomplete';
  if (todoActions[currentFilter] && todoActions[currentFilter][action]) {
    todoActions[currentFilter][action](todoItem);
  }
}

async function handleInputValueEvent(event, todoList, todoItem) {
  console.log('handleInputValueEvent', event, todoList, todoItem);
  const todoId = todoItem.dataset.id;
  const todo = {
    todo: {
      content: event.target.value.trim()
    }
  };
  console.log(todoId, todo);
  try {
    event.target.blur();
    await edit_todo(todoId, todo);
  } catch (error) {
    await showErrorMessage('更新待辦事項狀態', error);
  }
}
async function handleDeleteEvent(event, todoList, todoItem) {
  console.log('handleDeleteEvent', event, todoList, todoList.querySelectorAll('.todo-list-item').length===1);
  const todoId = todoItem.dataset.id;
  if (todoList.querySelectorAll('.todo-list-item').length===1) {
    handleTodoList([], true, todoList);
  } else {
    todoItem.querySelector('.option-input').checked || updateTodosCount(--activeTodosCount);
  }
  
  try {
    await del_todo(todoId);
    todoItem.remove();
  } catch (error) {
    await showErrorMessage('更新待辦事項狀態', error);
  }
}

async function showErrorMessage(operation, error) {
  console.error(`${operation}時出錯：`, error);
  if (error.status === 404) {
    await Swal.fire('伺服器更新，請刷新以同步資料', '', 'error');
  } else {
    await Swal.fire(`${operation}失敗`, message, 'error');
  }
  location.reload(true);
}

/* ----- Event Handlers ----- */
function addEventToLogout() {
  const logoutButton = document.getElementById('logout');
  logoutButton.addEventListener('click', handleLogout);
}

function addEventToAddTodo(todoList) {
  const todoInputWrapper = document.querySelector('.todo-input-wrapper');
  // todoInputWrapper.addEventListener('change', (event) => handleInputChange(event.target, todoList));
  todoInputWrapper.addEventListener('click', (event) => handleAddButtonClick(event, todoList));
  todoInputWrapper.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && event.target.classList.contains('todo-input')) {
      console.log('keypress');
      handleTodoInputChange(event.target, todoList);
    }
  });
  
}

function addEventToClearTodos(todoList) {
  const clearButton = document.getElementById('clearTodos');
  clearButton.addEventListener('click', () => clearCompletedTodos(todoList));
}

function addEventToTodoList(todoList) {
  todoList.addEventListener('change', delegateEvent);
}

async function clearCompletedTodos(todoList) {
  try {
    const todos = await fetchTodos();
    todos.forEach(async todo => {
      await del_todo(todo.id);
    })
    todoList.innerHTML = '';
    const filteredTodos = todos.filter(todo => !todo.completed_at);
    const isEmpty = filteredTodos.length === 0;
    console.log(filteredTodos, isEmpty, todoList);
    handleTodoList(filteredTodos, isEmpty, todoList);
  } catch (error) {
    console.error('清除已完成項目時出錯：', '', 'error');
  }
}

/* ----- Business Logic ----- */
async function handleLogout() {
  try {
    const response = await set_logout();
    console.log(response);
    await Swal.fire({
      title: `${response.data.message}`,
      text: '即將跳轉到登入頁面',
      icon: 'warning',
      timer: 2000,
      showConfirmButton: false
    });
    Storage.clear();
    window.location.href = 'signin.html';
  } catch (error) {
    await Swal.fire({
      title: '登出失敗',
      text: '請先登入',
      icon: 'warning',
      timer: 2000,
      showConfirmButton: false
    });
    window.location.href = 'signin.html';
  }
}

async function handleTodoList(data, isEmpty, todoList) {
  if (isEmpty) {
    console.log(activeTodosCount);
    updateTodosCount(0);
    if (activeTodosCount !== 0) {
      await Swal.fire({
        title: '成功刪除全部已完成項目',
        text: '',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
    activeTodosCount = 0;
    todoListWrapper.classList.remove('open');
    
    if (!todoListEmpty.classList.contains('open')) {
      todoListEmpty.classList.add('open');
    }
  } else {
    handelRenderTodoList(data, todoList);
    
    todoListEmpty.classList.remove('open');
    if (!todoListWrapper.classList.contains('open')) {
      todoListWrapper.classList.add('open');
    }
  }
}

async function processAddTodo(inputValue, inputElement, todoList) {
  inputElement.value = '';
  if (inputValue) {
    if (!activeTodosCount) {
      await handleTodoList([], false, todoList);
    }
    await addTodo(inputValue, todoList);
  } else {
    await Swal.fire('輸入框內容不可為空白', '', 'warning');
  }
}

async function handleTodoInputChange(inputElement, todoList) {
  const inputValue = inputElement.value.trim();
  processAddTodo(inputValue, inputElement, todoList);
}

async function handleAddButtonClick(event, todoList) {
  if (event.target.id !== 'addTodo') return;
  const inputElement = event.target.previousElementSibling;
  const inputValue = event.target.previousElementSibling.value.trim();
  processAddTodo(inputValue, inputElement, todoList);
}

async function renderTodoList(todos, todoList) {
  try {
    const todoListTemplate = todos.map(todo => createTodoListItem(todo)).join('');
    console.log(todoList, activeTodosCount);
    todoList.innerHTML = todoListTemplate;
  } catch (error) {
    console.log(error);
  }
}

async function handelRenderTodoList(todos, todoList, todosCount = false) {
  console.log(todos, todoList, todosCount);
  renderTodoList(todos, todoList);
  if (todosCount) {
    updateTodosCount(todosCount);  
  } else {
    updateTodosCount(todos.length);  
    // updateTodosCount(completedTodosCount(todos));  
  }
}

function updateTodosCount(dataCount) {
  console.log('updateTodosCount', dataCount);
  // const todosCount = document.querySelector('.todos-count');
  todosCount.textContent = `${dataCount}`;
}

function setCurrentFilter(currentTodosStatus) {
  currentFilter = currentTodosStatus;
  Storage.set('todosStatus', currentTodosStatus);
}

async function addTodo(inputValue, todoList) {
  console.log('addTodo', inputValue, todoList, activeTodosCount);
  try {
    const response = await add_todo({
      todo: {
        content: inputValue,
      },
    });

    const newTodos = response.data;
    const newTodoElement = document.createElement('li');
    newTodoElement.className = 'todo-list-item';
    newTodoElement.dataset.id = newTodos.id;
    newTodoElement.innerHTML = `
      <label class="checkbox">
        <input type="checkbox" class="option-input" />
      </label>
      <input class="input" value="${newTodos.content}" />
      <label class="checkbox">
        <input type="checkbox" class="delete" />
      </label>
    `;
    
    todoList.insertBefore(newTodoElement, todoList.firstChild);
    console.log(newTodos);
    updateTodosCount(++activeTodosCount);
  } catch (error) {
    console.error('添加待辦事項時出錯：', error);
  }
}

async function checkAuthorization() {
  try {
    await check_account();
    return true;
  } catch (error) {
    await Swal.fire({
      title: '驗證失敗',
      text: '請先登入',
      icon: 'warning',
      timer: 2500,
      showConfirmButton: false,
      didOpen: () => {
        Swal.getPopup().style.zIndex = 9999;
      },
      willClose: () => {
        const loadingImage = document.getElementById('loadingImage');
        if (loadingImage) {
          loadingImage.classList.add('d-none');
        }
        window.location.href = 'signin.html';
      }
    });
    return false;
  }
}

function createTodoListItem(todo) {
  return `
    <li class="todo-list-item" data-id="${todo.id}">
      <label class="checkbox">
        <input type="checkbox" class="option-input" ${todo.completed_at === null ? '' : 'checked'} />
      </label>
      <input class="input" value="${todo.content}" />
      <label class="checkbox">
        <input type="checkbox" class="delete" />
      </label>
      <!-- <a href="#" class="delete"></a> -->
    </li>
  `;
}

async function setNickname() {
  console.log(userData);
  const nickname = document.querySelector('.nickname');
  nickname.textContent = `${userData.nickname}`;
}

// 應用過濾器並更新列表
async function applyTodoFilter(filterId, todoList) {
  const filters = {
    allTodos: todos => todos,
    activeTodos: todos => todos.filter(todo => !todo.completed_at),
    completedTodos: todos => todos.filter(todo => todo.completed_at)
  };
  const todoStatusMapping = {
    allTodos: '全部',
    activeTodos: '待完成',
    completedTodos: '已完成'
  }
  if (!filters.hasOwnProperty(filterId)) return;
  setCurrentFilter(filterId);
  const todos = await fetchTodos();
  console.log(todos);
  const filteredTodos = filters[filterId](todos);
  const todosCount = filterId === 'allTodos' ? todos.length : filteredTodos.length;
  activeTodosCount = todosCount;
  console.log(todosCount, activeTodosCount);
  handelRenderTodoList(filteredTodos, todoList, todosCount);
  todosStatus.textContent = todoStatusMapping[filterId];
}

function switchActiveFilterStyle(clickedButton, currentActiveElement) {
  if (currentActiveElement !== clickedButton.parentElement) {
    currentActiveElement.classList.remove('active');
    clickedButton.parentElement.classList.add('active');
  }
}

function addEventToTodoListNav(todoList) {
  const todoListNav = document.querySelector('.todo-list-nav');
  
  todoListNav.addEventListener('click', async(event) => {
    const clickedButton = event.target.closest('button');
    if (clickedButton) {
      switchActiveFilterStyle(clickedButton, todoListNav.querySelector('.active'));
      await applyTodoFilter(clickedButton.id, todoList);
    }
  });
}

function handleInitialize() {
  setNickname();
  setCurrentFilter('allTodos');
}

// 1. 初始化基本設置和數據獲取
async function initializeApp() {
  // await checkAuthorization();
  const isAuthorized = await checkAuthorization();
  if (!isAuthorized) return;
  getStorage();
  const todos = await fetchTodos();
  activeTodosCount = todos.length;
  return todos;
}

// 2. DOM 準備就緒後的 UI 初始化和事件綁定
function initializeUI(todoList) {
  addEventToLogout();
  addEventToAddTodo(todoList);
  addEventToClearTodos(todoList);
  addEventToTodoListNav(todoList);
  addEventToTodoList(todoList);
  handleInitialize();
}

// 3. 數據獲取完成後的 UI 更新
function updateUIWithData(todos, todoList) {
  console.log('updateUIWithData', todos, todoList);
  handleTodoList(todos, todos.length === 0, todoList);
  const isGitHubPages = window.location.hostname.includes('github.io');
  const root = document.documentElement;
  const deleteBackgroundUrl = isGitHubPages ? '/auth-todolist/assets/images/delete.jpg' : 'url("/assets/images/delete.jpg")';
  root.style.setProperty('--base-url', deleteBackgroundUrl);
}

function initUI(todoList) {
  // const todoList = document.querySelector('.todo-list-ul');
  initializeUI(todoList);
  // updateUIWithData(todos, todoList);
  fadeOutLoading();
  document.querySelector('.loading').classList.add('d-none');
}

function fadeOutLoading() {
  const loading = document.querySelector('.loading');
  if (loading) {
    loading.style.opacity = '0';
    loading.addEventListener('transitionend', () => {
      loading.style.display = 'none';
    }, { once: true });
  }
}

/* ----- Entry Point ----- */
// 主函數
async function main() {
  try {
    const todos = await initializeApp();
    console.log(todos);
    if (!todos) return; // 避免 checkAuthorization 失敗還繼續執行
    
    // 等待 DOM 加載完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        // const todoList = document.querySelector('.todo-list-ul');
        console.log('DOM 尚未加載完成', todoList);
        updateUIWithData(todos, todoList);
        initUI(todoList);
      });
    } else {
      // 如果 DOM 已經加載完成，直接執行
      // const todoList = document.querySelector('.todo-list-ul');
      console.log('DOM 加載完成', todoList);
      updateUIWithData(todos, todoList);
      initUI(todoList);
    }
  } catch (error) {
    console.error('初始化應用程序時發生錯誤：', error);
    // 處理錯誤，例如顯示錯誤消息給用戶
  }
}
main();