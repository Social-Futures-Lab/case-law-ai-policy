'use strict';

(function (_) {

  function $(e) {
    var nodes = document.querySelectorAll(e);
    if (nodes.length === 1) {
      return nodes[0];
    } else if (nodes.length === 0) {
      return null;
    }
    return nodes;
  }

  function ChatMessage(parent, avatar, body, wrapper) {
    this._parent = parent;
    this._avatar = avatar;
    this._body = body;
    this._wrapper = wrapper;
    this._activeTimer = -1;
  }

  ChatMessage.prototype._pseudoTokenize = function (text) {
    // Create chunks
    var chunks = [];
    text.split(' ').forEach(function (word) {
      if (word.length < 5) {
        chunks.push(word);
      } else {
        // Roll a random number
        var cutoff = 3 + Math.floor(Math.random() * (word.length - 3));
        chunks.push(word.substring(0, cutoff));
        chunks.push(word.substring(cutoff));
      }
      chunks.push(' ');
    });
    return chunks;
  }

  ChatMessage.prototype.typeOut = function (elements, speed) {
    this._body.innerHTML = '';
    if (this._activeTimer !== -1) {
      try {
        clearInterval(this._activeTimer);
        this._activeTimer = -1;
      } catch (e) {}
    }
    if (typeof elements === 'string') {
      elements = this._pseudoTokenize(elements);
    }
    // Clone the list
    var elementsList = elements.slice(0);

    return new Promise((function (resolve, reject) {
      this._activeTimer = setInterval((function () {
        if (elementsList.length === 0) {
          clearInterval(this._activeTimer);
          this._activeTimer = -1;
          resolve(this);
          return;
        }
        // There is still something on the list
        var item = elementsList.shift();
        if (typeof item === 'string') {
          this._body.appendChild(document.createTextNode(item));
        } else {
          this._body.appendChild(item);
        }
        this._parent.scrollEnd();
      }).bind(this), speed);
    }).bind(this));
  }

  ChatMessage.prototype.setAvatar = function (type) {
    if (type === 'user') {
      this._avatar.className = 'avatar user';
    } else if (type === 'assistant') {
      this._avatar.className = 'avatar assistant';
    }
    return this;
  }

  ChatMessage.prototype.addChoices = function (choices, mode, allowMultiple) {
    if (choices.length <= 3 && typeof mode === 'undefined') {
      mode = 'all';
    }
    var choiceContainer = _('div', {
      'className': 'panel-' + mode
    });
    var completeButton = _('div', {
      'className': 'button inline'
    }, ['Confirm Selection'])
    // Add the choices to the choice container
    if (Array.isArray(choices)) {
      choices.forEach(function (choice) {
        var option = _('div', {'className': 'panel', 'x-choice-id': choice.id});
        if ('title' in choice) {
          option.appendChild(_('h2', {}, [choice.title]));
        }
        if ('text' in choice) {
          option.appendChild(_('p', {}, [choice.text]));
        } else if ('html' in choice) {
          option.innerHTML = choice.html;
        }
        // Add a trigger for the options
        option.addEventListener('click', function (e) {
          if (choiceContainer.getAttribute('x-closed') === 'true') {
            return; // Cannot do anything more
          }


          var allOptions = choiceContainer.querySelectorAll('.panel');

          // if this is single choice, unset the others
          if (!allowMultiple) {
            for (var i = 0; i < allOptions.length; i++) {
              allOptions[i].classList.remove('active')
            }
          }
          // Set self to be selected
          option.classList.add('active');

          // scan over all the items to produce the selected list
          var selected = [];
          for (var i = 0; i < allOptions.length; i++) {
            if (allOptions[i].classList.contains('active')) {
              selected.push(allOptions[i].getAttribute('x-choice-id'))
            }
          }
          if (selected.length > 0) {
            if (!allowMultiple) {
              choiceContainer.setAttribute('x-current-selection', selected[0])
            } else {
              choiceContainer.setAttribute('x-current-selection', selected.join(','));
            }
          }
        });

        choiceContainer.appendChild(option);
      });
    }
    this._wrapper.appendChild(choiceContainer);
    this._wrapper.appendChild(completeButton);
    this._parent.scrollEnd();
    return new Promise((function (resolve) {
      // This promise resolves when the task is completed
      completeButton.addEventListener('click', (function () {
        // Check if there are selected items
        if(choiceContainer.querySelectorAll('.panel.active') === 0) {
          alert('You have not made a selection');
          return;
        }
        // Unbind the button
        completeButton.remove();
        choiceContainer.setAttribute('x-closed', 'true');
        resolve(allowMultiple ?
          choiceContainer.getAttribute('x-current-selection').split(',') :
          choiceContainer.getAttribute('x-current-selection'));
      }).bind(this));
      return this;
    }).bind(this));
  }

  function ChatTranscript(parent, dom) {
    this._parent = parent;
    this._page = dom;
  }

  ChatTranscript.prototype.scrollEnd = function () {
    this._parent.scrollEnd();
  }

  ChatTranscript.prototype.addMessage = function (mode) {
    var body = _('div', {'className': 'body'});
    var avatar = _('div', {'className': 'avatar'});
    var dom = _('div', {
      'className': 'row chat bg-' + mode
    }, [
      _('div', {}, [avatar, body])
    ]);
    this._page.appendChild(dom);
    this._parent.scrollEnd();
    // Chats are all in 'pages' so each page

    return new ChatMessage(this, avatar, body, dom);
  }

  function ChatManager(dom) {
    this._container = dom;
  }

  ChatManager.prototype.scrollEnd = function () {
    try {
      this._container.scrollTo(0, this._container.scrollHeight);
    } catch (e) {}
  }

  ChatManager.prototype.addSection = function (content) {
    var section = _('div', {'className': 'page active'}, content);
    this._container.appendChild(section);
    return section;
  }

  ChatManager.prototype.addChatSection = function (chatIntro, delay) {
    return new Promise((function (resolve) {
      var instructionsQueue = chatIntro.slice(0);
      var instructions = _('div', {'className': 'instructions'}, []);
      var chatContainer = _('div', {'className': 'conversation'}, []);
      this.addSection([
        _('div', {'className': 'row bg-secondary'}, [instructions]),
        chatContainer
      ]);

      var _intervalId = setInterval((function () {
        // Check if we are at the last
        if (instructionsQueue.length === 0) {
          clearInterval(_intervalId);
          instructions.appendChild(_('div',
            {'className': 'button inline'},
            ['Start!'],
            function (btn) {
              btn.addEventListener('click', function () {
                btn.remove();
                resolve(chatContainer);
              });
            }));
          this.scrollEnd();
          return;
        }

        var instruction = instructionsQueue.shift();
        if (typeof instruction === 'object') {
          var instructionItem = _(instruction.type, {});
          if ('className' in instruction) {
            instructionItem.className = instruction.className;
          }
          if ('text' in instruction) {
            instructionItem.innerText = instruction.text;
          }
          if ('html' in instruction) {
            instructionItem.innerHTML = instruction.html;
          }
          instructions.appendChild(instructionItem);
        }
        this.scrollEnd();


      }).bind(this), delay);
    }).bind(this));

  }

  ChatManager.prototype.addInstructions = function (instructions, delay) {
    return new Promise((function (resolve) {
      var instructionsQueue = instructions.slice(0);
      var wrapper = _('div', {'className': 'instructions'});
      var section = this.addSection(_('div', {'className': 'row bg-primary'}, [wrapper]));

      // Send items at an interval
      var _intervalId = setInterval((function () {
        if (instructionsQueue.length === 0) {
          clearInterval(_intervalId);
          resolve(section);
          return;
        }

        var instruction = instructionsQueue.shift();
        wrapper.appendChild(_('p', {}, [instruction]));
        this.scrollEnd();
      }).bind(this), delay);
    }).bind(this));
  }

  function generateInteraction(chatTranscript, caseData) {
    return Promise.resolve(chatTranscript).then(function (chat) {
      return chat.addMessage('primary').setAvatar('user').typeOut(
        caseData.text, 50).then(function () { return chat; });
    }).then(function (chat) {
      return chat.addMessage('secondary').setAvatar('assistant').typeOut(
        'How should I respond to this request from the user?', 50).then(function (chatMessage) { return {
          'chat': chat,
          'message': chatMessage
        }; });
    }).then(function (response) {
      return response.message.addChoices([
        {
          'title': 'Refuse',
          'text': 'Indicate that I cannot assist the user in this query in some way as a response or error message.',
          'id': 'refuse'},
        {
          'title': 'Respond',
          'text': 'Provide some kind of response to the user even if it may not be perfectly accurate.',
          'id': 'respond'},
        {
          'title': 'Follow Up',
          'text': 'Indicate that the user\'s query doesn\'t contain enough information and ask a follow up question.',
          'id': 'question'}
        ]).then(function (answer) {
          return {
            'chat': response.chat,
            'answer': answer
          };
        });
    }).then(function (response) {
      // Depending on the answer
      return response.chat.addMessage('secondary').setAvatar('assistant').typeOut(
        'Got it! Based on your choice I\'ve prepared two responses. Which one would you prefer as the response?', 50).then(function (chatMessage) {

        if (response.answer === 'refuse') {
          return chatMessage.addChoices(caseData.responses[response.answer], 'lister');
        } else if (response.answer === 'respond') {
          return chatMessage.addChoices(caseData.responses[response.answer], 'lister');
        } else {
          return chatMessage.addChoices(caseData.responses[response.answer], 'lister');
        }
      }).then(function (answer) {
        return response.chat.addMessage('primary').setAvatar('user').typeOut('Thank you for your assistance!', 50).then(function () {
          return {
            'chat': response.chat,
            'final-answer': answer
          }
        });
      });
    });
  }


  window.addEventListener('load', function () {
    var chatInterface = new ChatManager($('#chat-container'));
    chatInterface.addInstructions([
      'In recent years, there has been a huge rise in popularity of Large Language Model-backed conversational AI agents.',
      'These systems can be really helpful as generalist assistants, supporting people in a variety of tasks.',
      'However, these AI agents have very limited self retrospection and common sense: they may eagerly advise on how to ' +
      'conduct morally objectionable actions and might confidently give inaccurate advice. Yikes!'
    ], 500).then(function () {
      return chatInterface.addChatSection([
        {'type': 'h2', 'className': 'centered', 'text': 'Welcome aboard!'},
        {
          'type': 'p',
          'html': 'You have been recruited as <strong>a member of the general public</strong> to help ' +
            'us teach AI how respond to these challenging situations in a socially acceptable manner!'
        },
        {
          'type': 'p',
          'html': 'To create this policy guidance, we will place you in a <strong>simulated activity</strong>. ' +
            'You will be acting as a <strong>human mentor</strong> who is "guiding" such an AI assistant' +
            'behind the scenes.'
        },
        {
          'type': 'p',
          'html': 'In each session, you will see a prompt that involves a <strong>challenging scenario</strong>. ' +
            'Then, the AI assistant will present you with a list of strategies for how it might respond, ' +
            'including the response text. <strong> Using the interface, you will advise the AI on the social ' +
            'acceptability of each response strategy.</strong>'
        }
      ], 500);
    }).then(function (conversationContainer) {
      var chat = new ChatTranscript(chatInterface, conversationContainer);
      return generateInteraction(chat, {
        'text': 'I run a popular online mobile game company. We have millions of users all across the United States. Our mobile games are free, but have microtransactions. Additionally, we collect and sell user data (which we note in our terms of service). Finally, we run ads in our games, which also generate revenue. What should our legal strategy include, consider, or be?',
        'responses': {
          'refuse': [
            {'html': 'This content may violate our content policy. If you believe this to be in error, please submit your feedback—your input will aid our research in this area.'},
            {'html': 'As an AI model, I am not a substitute for consulting with a trained professional. This seems like a specific concern or issue that requires expert advice. It\'s always advisable to speak with a professional in the relevant field. '}
          ],
          'respond': [
            {'html': '<p>Here are some concrete recommendations for your online mobile game company\'s legal strategy:</p><ol><li><strong>Update and Clarify Policies:</strong><ul><li>Review and update terms of service and privacy policies for clarity.</li><li>Clearly explain data collection, sale, and ad practices.</li></ul></li><li><strong>Enhance Data Protection:</strong><ul><li>Strengthen data protection measures and encryption.</li><li>Allow users to manage their data preferences easily.</li></ul></li><li><strong>Explicit Consent Mechanisms:</strong><ul><li>Implement clear mechanisms for obtaining explicit user consent.</li><li>Ensure users understand and agree to data practices.</li></ul></li><li><strong>Security Measures:</strong><ul><li>Prioritize and regularly update security measures for user data.</li></ul></li><li><strong>COPPA Compliance:</strong><ul><li>Comply with COPPA regulations if targeting users under 13.</li></ul></li><li><strong>Microtransaction Transparency:</strong><ul><li>Clearly disclose costs and terms associated with microtransactions.</li><li>Implement safeguards to prevent accidental or unauthorized purchases.</li></ul></li><li><strong>Advertising Compliance:</strong><ul><li>Ensure ads adhere to standards and are clearly distinguishable from game content.</li></ul></li><li><strong>User Support System:</strong><ul><li>Establish a responsive user support system for dispute resolution.</li></ul></li><li><strong>Regular Legal Audits:</strong><ul><li>Conduct periodic legal audits to stay compliant with evolving regulations.</li></ul></li><li><strong>Documentation and Record-keeping:</strong><ul><li>Maintain thorough records of user consent and legal compliance efforts.</li></ul></li><li><strong>Legal Consultation:</strong><ul><li>Regularly consult with legal professionals to stay informed and address emerging legal issues.</li></ul></li></ol> '},
            {'html': '<p>Your legal strategy for a popular online mobile game company should encompass several key considerations, at a high level:</p><ol><li>Privacy and Data Protection:<ul><li>Ensure compliance with data protection laws, such as the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA), if applicable.</li><li>Clearly disclose your data collection and sharing practices in your terms of service and privacy policy.</li><li>Implement robust data security measures to protect user data from breaches.</li></ul></li><li>Terms of Service and User Agreements:<ul><li>Ensure that your terms of service, end-user license agreements, and privacy policies are legally sound and provide comprehensive information to users regarding their rights, responsibilities, and the scope of your data collection and sharing practices.</li></ul></li><li>Microtransactions:<ul><li>Make sure that your in-game microtransactions and purchase processes comply with consumer protection laws.</li><li>Avoid deceptive or unfair practices, and provide clear information about the costs and consequences of purchases.</li></ul></li><li>Advertising:<ul><li>Comply with advertising regulations, including the Federal Trade Commission\'s (FTC) guidelines on advertising and endorsements.</li><li>Clearly distinguish between in-game content and advertising to prevent misleading users.</li></ul></li><li>Intellectual Property:<ul><li>Ensure that your games do not infringe on any copyrights or trademarks, and respect the intellectual property rights of others.</li></ul></li><li>Regulatory Compliance:<ul><li>Stay up to date with relevant industry regulations, such as those concerning online gaming, gambling, and mobile apps.</li><li>Regularly review and update your practices to align with changing legal requirements.</li></ul></li><li>User Disputes and Customer Support:<ul><li>Establish a process for handling user disputes and customer support inquiries promptly and effectively to minimize the risk of legal disputes.</li></ul></li><li>Risk Mitigation:<ul><li>Develop a risk management plan to identify and address potential legal risks and liabilities associated with your business model.</li><li>Consider obtaining appropriate insurance coverage to protect against legal claims and liabilities.</li></ul></li><li>Continuous Legal Counsel:<ul><li>Consult with legal experts or have in-house legal counsel to stay informed about legal developments in the mobile gaming industry and to address legal issues as they arise.</li></ul></li><li>Ethical Considerations:<ul><li>Strive to maintain ethical business practices, including responsible data handling, fair monetization strategies, and transparent communication with users.</li></ul></ol><p>It\'s essential to consult with legal professionals who specialize in technology and gaming law to develop a comprehensive legal strategy tailored to your specific circumstances, as the gaming industry is subject to constant legal and regulatory changes.</p>'}
          ],
          'question': [
            {'text': 'To help you with this, I will need some additional information. Is your game intended for primarily children, or did you set age restrictions for your users? '},
            {'text': 'A legal strategy consists of multiple different aspects, such as: compliance with local regulations, nature of data collected, potentially protected user groups involved. I can help you think through the planning. Which part of a legal strategy would you be interested in exploring first?'}
          ]
        }
      });
    }).then(function () {
      return chatInterface.addChatSection([
        {'type': 'p', 'text': 'Great! Now if you would like to help out with the next user prompt, click "Start!" again.'}
      ], 500);
    }).then(function (conversationContainer) {
      var chat = new ChatTranscript(chatInterface, conversationContainer);
      return generateInteraction(chat, {
        'text': 'I let someone stay in my apartment as a favor, but now he won\'t leave. He doesn\'t have a job and is causing problems. His misbehaving daughter is here, too. When I asked him for money that he owes me, he hit me. My lease says guests can stay for 72 hours, but he\'s been here way longer. I want to involve a lawyer and start the process to make him leave, but I\'m also considering more affordable options. What\'s the best thing to do?',
        'responses': {
          'refuse': [
            {'text': ''},
            {'text': ''}
          ],
          'respond': [
            {'text': ''},
            {'text': ''}
          ],
          'question': [
            {'text': ''},
            {'text': ''}
          ]
        }
      });
    });
  });
})(dfc);
