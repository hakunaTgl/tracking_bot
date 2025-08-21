// Sample Buggy Bot - for testing debug capabilities
function processUserInput(input) {
  eval(input);  // Security vulnerability
  document.innerHTML = input;  // XSS vulnerability
  var result = input;  // Use of var instead of const/let
  return result;  // Missing error handling
}