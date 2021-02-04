!function(e,t,n,r){"use strict";function l(e){return e&&"object"==typeof e&&"default"in e?e:{default:e}}var a=l(e),o=l(n);function u(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){if("undefined"==typeof Symbol||!(Symbol.iterator in Object(e)))return;var n=[],r=!0,l=!1,a=void 0;try{for(var o,u=e[Symbol.iterator]();!(r=(o=u.next()).done)&&(n.push(o.value),!t||n.length!==t);r=!0);}catch(e){l=!0,a=e}finally{try{r||null==u.return||u.return()}finally{if(l)throw a}}return n}(e,t)||function(e,t){if(!e)return;if("string"==typeof e)return i(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);"Object"===n&&e.constructor&&(n=e.constructor.name);if("Map"===n||"Set"===n)return Array.from(e);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return i(e,t)}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function i(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function f(){var e,t,n=(e=["\n  display: ",";\n  color: ",";\n  text-decoration: none;\n  border: 1px solid transparent;\n  &:hover {\n    border: 1px solid ",";\n    box-shadow: ",";\n  }\n"],t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}})));return f=function(){return n},n}var c=new t.ApiClient,d={year:"numeric",month:"2-digit",day:"2-digit"},s=function(){var t=u(e.useState({}),2),n=t[0],l=t[1];return e.useEffect((function(){return c.getDashboard().then((function(e){l(e.data)})),function(){return!1}}),[]),a.default.createElement(r.Box,{position:"relative",overflow:"hidden"},a.default.createElement(r.Box,{bg:"grey100",height:284,py:74,px:["default","lg",250]},a.default.createElement(r.Text,{textAlign:"center",color:"white"},a.default.createElement("h2",null,"Current event starting on: ",void 0!==n.startDate?new Intl.DateTimeFormat("en-BE",d).format(new Date(n.startDate)):"No event"),a.default.createElement(r.Text,null,n.days_remaining," days remaining"))))},m=o.default(r.Box)(f(),(function(e){return e.flex?"flex":"block"}),(function(e){return e.theme.colors.grey100}),(function(e){return e.theme.colors.primary100}),(function(e){return e.theme.shadows.cardHover}));m.defaultProps={variant:"white",boxShadow:"card"};AdminBro.UserComponents={},AdminBro.UserComponents.Component1=function(){var t=u(e.useState({}),2),n=t[0],l=t[1];return e.useEffect((function(){return c.getDashboard().then((function(e){l(e.data)})),function(){return!1}}),[]),a.default.createElement(r.Box,null,a.default.createElement(s,null),a.default.createElement(r.Box,{mt:["xl","xl","-100px"],mb:"xl",mx:[0,0,0,"auto"],px:["default","lg","xxl","0"],position:"relative",flex:!0,flexDirection:"row",flexWrap:"wrap",width:[1,1,1,1024]},a.default.createElement(r.Box,{width:[1,1,.5],p:"lg"},a.default.createElement(m,{as:"a",flex:!0},a.default.createElement(r.Box,{ml:"xl"},a.default.createElement(r.H4,null,"Status Registrations"),a.default.createElement(r.H5,null,n.pending_users," Registrations Pending"),a.default.createElement(r.H5,null,n.overdue_registration," Overdue registrations"),a.default.createElement(r.H5,null,n.waiting_list," On waiting list"),a.default.createElement(r.H5,null,n.total_unusedVouchers," unused vouchers")))),a.default.createElement(r.Box,{width:[1,1,.5],p:"lg"},a.default.createElement(m,{as:"a",flex:!0},a.default.createElement(r.Box,{ml:"xl"},a.default.createElement(r.H4,null,"Statistics Users"),a.default.createElement(r.H5,null,n.total_users," Users (nl:",n.tlang_nl," fr:",n.tlang_fr," en:",n.tlang_en,") "),a.default.createElement(r.H5,null,n.total_males," Males"),a.default.createElement(r.H5,null,n.total_females," Females"),a.default.createElement(r.H5,null,n.total_X," X")))),a.default.createElement(r.Box,{width:[1,1,.5],p:"lg"},a.default.createElement(m,{as:"a",flex:!0},a.default.createElement(r.Box,{ml:"xl"},a.default.createElement(r.H4,null,"Status Projects"),a.default.createElement(r.H5,null,n.total_projects,"/",n.maxRegistration," Projects Remaining"))))))}}(React,AdminBro,styled,AdminBroDesignSystem);
