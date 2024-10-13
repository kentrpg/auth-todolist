import { get_signin, get_signup, setToken } from './api/dataService.js';

/* ----- Setup for Sign Up and Sign In Pages ----- */
const { textContent: authFormTitle = '' } = document.querySelector('.auth-form-title');
const inputsToValidate = selectEventToSubmit(authFormTitle);

/* ----- Event Handlers ----- */
function addEventToValidate() {
  inputsToValidate.forEach(input => {
    input.addEventListener('blur', () => validateInputAndUpdateUI(input));
  });
}

function addEventToSubmit(isSignUp) {
  const submitButton = document.querySelector('.auth-form-footer button[type="submit"]');
  submitButton.addEventListener('click', handleSubmit(isSignUp));
}

function handleSubmit(isSignUp) {
  return async function(event) {
    event.preventDefault();
    
    if (!checkAllInputsvalidate()) {
      setInputsToValidate();
      return;
    }
    if (isSignUp && !checkPasswordMatch()) {
      await Swal.fire('密碼不相同，請重新輸入', '', 'warning');
      clearPasswords();
      return;
    }
    try {
      await processSubmission(isSignUp);
    } catch (error) {
      showErrorMessage(error, isSignUp);
    }
  };
}

async function handleSignUpSuccess() {
  await Swal.fire({
    title: '註冊成功！請重新登入',
    icon: 'success',
    timer: 2000,
    showConfirmButton: false
  });
  window.location.href = 'signin.html';
}

function setStorage({token, nickname}) {
  // setup token
  setToken(token);
  localStorage.setItem('token', token);

  // setup nickname
  localStorage.setItem('nickname', nickname);

  // setup todosStatus
  localStorage.setItem('todosStatus', 'allTodos');
}

async function handleSignInSuccess(response) {
  const storage = {
    token: response.headers.authorization,
    nickname: response.data.nickname.trim() || '使用者'
  };
  setStorage(storage);
  await showSuccessMessage(`Hi，${storage.nickname} `);
  clearAllInputs();
  window.location.href = 'index.html';
}

async function processSubmission(isSignUp) {
  const userData = { user: createUserData(isSignUp) };
  try {
    const response = await (isSignUp ? get_signup(userData) : get_signin(userData));
    if (isSignUp) {
      await handleSignUpSuccess();
    } else {
      await handleSignInSuccess(response);
    }
  } catch (error) {
    showErrorMessage(error, isSignUp);
  }
}

/* ----- Business Logic ----- */
function createUserData(isSignUp) {
  const baseData = {
    email: inputsToValidate[0].value.trim(),
    password: isSignUp ? inputsToValidate[2].value.trim() : inputsToValidate[1].value.trim()
  };
  return isSignUp ? {...baseData, nickname: inputsToValidate[1].value.trim()} : baseData;
}

function selectEventToSubmit(submitType) {
  if (submitType === '註冊帳號') {
    return document.querySelectorAll('#signupEmail, #name ,#password, #passwordDoubleCheck');
  } else {
    return document.querySelectorAll('#signinEmail, #password');
  }
}

function setInputsToValidate() {
  inputsToValidate.forEach(input => validateInputAndUpdateUI(input));
}

function validateInputAndUpdateUI(input, errorMessage = '此欄位不可為空白') {
  const isValid = input.value.trim() !== '';
  input.classList.toggle('is-invalid', !isValid);
  const formText = input.nextElementSibling;
  if (formText) {
    formText.textContent = isValid ? '' : errorMessage;
  }
}

function checkAllInputsvalidate() {
  return Object.values(inputsToValidate).every(input => 
    !input.classList.contains('is-invalid') && input.value.trim() !== ''
  );
}

function checkPasswordMatch() {
  return inputsToValidate[2].value === inputsToValidate[3].value;
}

function clearPasswords() {
  inputsToValidate[2].value = '';
  inputsToValidate[3].value = '';
}

function clearAllInputs() {
  inputsToValidate.forEach(input => input.value = '');
}

function showSuccessMessage(message) {
  return Swal.fire({
    title: `${message} 👋`,
    text: '恭喜登入成功',
    icon: 'success',
    timer: 2000,
    showConfirmButton: false
  });
}

function showErrorMessage(error, isSignUp) {
  const errorMessage = isSignUp
    ? error.response.data?.error[0]
    : '請重新嘗試，或點擊註冊帳號';
  Swal.fire({
    title: error.response.data.message,
    text: errorMessage,
    icon: 'error'
  });
}

/* ----- Entry Point ----- */
function main() {
  addEventToValidate();
  addEventToSubmit(authFormTitle === '註冊帳號');
}
main();
