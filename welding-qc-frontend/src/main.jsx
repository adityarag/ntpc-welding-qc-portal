import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Your Tailwind styles import directive

// Global Interceptor for Input Uppercasing
const originalCreateElement = React.createElement;
React.createElement = function (type, props, ...children) {
  if ((type === 'input' || type === 'textarea') && props) {
    const inputType = props.type;
    const isExcluded =
      inputType === 'password' ||
      inputType === 'file' ||
      inputType === 'date' ||
      inputType === 'number' ||
      inputType === 'checkbox' ||
      inputType === 'radio';

    if (!isExcluded) {
      // Modify onChange to convert typed characters to uppercase
      const originalOnChange = props.onChange;
      if (originalOnChange) {
        props.onChange = function (e) {
          if (e && e.target && typeof e.target.value === 'string') {
            const originalVal = e.target.value;
            const upperVal = originalVal.toUpperCase();
            
            if (originalVal !== upperVal) {
              // Override target.value temporarily on the target element so the React state updates to uppercase
              Object.defineProperty(e.target, 'value', {
                get: () => upperVal,
                configurable: true
              });
              
              originalOnChange.apply(this, arguments);
              
              // Restore default prototype value property
              delete e.target.value;
              return;
            }
          }
          return originalOnChange.apply(this, arguments);
        };
      }

      // Enforce uppercase style so the browser displays it in uppercase immediately
      props.style = {
        ...props.style,
        textTransform: 'uppercase'
      };
    }
  }
  return originalCreateElement.apply(this, [type, props, ...children]);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)