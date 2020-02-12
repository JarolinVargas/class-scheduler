class classScheduler {
    constructor(element) {
        this.classScheduler = element;
        this.inputContainer = element.querySelector('.cs-input');
        this.outputContainer = element.querySelector('.cs-output');
        this.outputLabelAndValueList = this.outputContainer.querySelector('.label-and-value-list');
        this.parentOptions = element.querySelectorAll('[data-parent-options]');
        this.submitBtn = element.querySelector('[data-submit-btn]');
        this.selectedOptions = element.querySelector('[data-selected-options]');
        this.notificationTimeout = null;
        this.data = {
            areasOfStudy: {
                Sports: {
                    schedules: [
                        ['July 23', 'August 23'],
                        ['August 26', 'September 26']
                    ]
                },
                Art: {
                    schedules: [
                        ['May 10', 'June 10'],
                        ['July 11', 'August 11']
                    ]
                },
                Literature: {
                    schedules: [
                        ['July 11', 'October 11']
                    ]
                },
                Music: {
                    schedules: [
                        ['June 9', 'July 9'],
                        ['August 9', 'September 9']
                    ]
                }
            }
        }
        
        this.classScheduler.querySelector('.show-output-btn').addEventListener('click', this.toggleOutput);
        this.outputContainer.querySelector('[data-editable]').addEventListener('click', this.toggleOutput);
        this.outputContainer.addEventListener('transitionend', this.outputTransitionEnd);
        this.selectedOptions.addEventListener('click', this.removeSchedule);
        this.submitBtn.addEventListener('click', this.submitForm);

        // add areas of study options to parent element
        // based on clicked parent option; add child options to the corresponding child options element
        for( let i = 0; i < this.parentOptions.length; i++ ) {
            const matchingChildOptionsEl = element.querySelector(`[data-child-options="${this.parentOptions[i].getAttribute('data-parent-options')}"]`).querySelector('ul');
            const key = this.parentOptions[i].getAttribute('data-parent-options');
            const options = Object.keys(this.data[key]);
            const optionsList = options.map(option => {
                return `<li data-child-options-key="${option}">${option}</li>`;
            });
            this.parentOptions[i].querySelector('ul').innerHTML = optionsList.join('');

            // parent options
            this.parentOptions[i].addEventListener('mousedown', (event) => {
                if( event.target.tagName === 'LI' ) {
                    const active = this.parentOptions[i].querySelector('li.options-list-active');
                    active && active.classList.remove('options-list-active');
                    event.target.classList.add('options-list-active');
                    // show child options in matching data-child-options element
                    const activeKey = event.target.getAttribute('data-child-options-key');
                    const childOptionsList = this.data.areasOfStudy[activeKey].schedules.map(option => {
                        return `<li data-child-option="${activeKey}: ${option}" data-option-array="${option.concat(activeKey)}">${option[0]} - ${option[1]}</li>`;
                    });
                    matchingChildOptionsEl.innerHTML = childOptionsList.join('');
                }
            });
            
            // child options
            matchingChildOptionsEl.addEventListener('click', () => {
                if( event.target.tagName === 'LI' ) {
                    const selectionsEl = this.classScheduler.querySelector(`[data-selected-options="${key}"]`).querySelector('ul');
                    const selectedSchedule = event.target.getAttribute('data-child-option');
                    const selectionArray = event.target.getAttribute('data-option-array').split(',');
                    const label = selectedSchedule.replace(',', ' - ');
                    this.validateClassSelection(selectionsEl, label, selectionArray) && this.addSchedule(selectionsEl, label, selectionArray.toString());
                }
            })
        }
    }


    // check for date range overlaps and duplicate schedules
    // loop through each selected class and compare date ranges. Boolean is returned depending on overlap and stored in array. If the array includes 'false' boolean; there's an overlap conflict.
    validateClassSelection = (selectionsEl, label, selectionArray) => {
        const selectedClasses = selectionsEl.querySelectorAll('li[data-item-dates]');
        let schedulesOverlap = [];
        if( !selectionsEl.querySelector(`li[data-item-value="${label}"]`) ) {
            for( let i = 0; i < selectedClasses.length; i++ ) {
                const array = selectedClasses[i].getAttribute('data-item-dates').split(',');
                const [start1, end1] = [new Date(array[0]), new Date(array[1])];
                const [start2, end2] = [new Date(selectionArray[0]), new Date(selectionArray[1])];
                (end1 <= start2 || start1 >= end2) ? schedulesOverlap.push(true) : schedulesOverlap.push(false);
            }
            if( !schedulesOverlap.includes(false) ) {
                return true;
            } else {
                this.toggleNotification(true, 'This schedule conflicts with one more selected schedules');
                return false;
            }
        } else {
            this.toggleNotification(true, 'This schedule has already been selected');
            return false;
        }
    }


    // append selected schedule to selections list
    addSchedule = (selectionsEl, label, selectionArray) => {
        const selectionItems = selectionArray.split(',');
        selectionsEl.insertAdjacentHTML('beforeend', `
            <li data-item="Class" data-item-value="${label}" data-item-dates="${selectionArray}">
                <i class="fas fa-times remove-selection"></i>
                <span>${label}</span>
                <input type="hidden" value="${selectionItems[0]}, ${selectionItems[1]}" name="${selectionItems[2].toLowerCase()}" data-input-schedule/>
            </li>`
        );
    }


    // remove clicked schedule from selections list
    removeSchedule = (event) => {
        if( event.target.classList.contains('remove-selection') ) {
            event.target.parentNode.remove();
        }
    }


    // show or hide the output container
    // trigger HTML5 form validation before showing output
    // to avoid shrinking input and output container contents during animation; lock the width with inline styles beforehand
    toggleOutput = () => {
        if( !this.inputContainer.reportValidity() ) {
            return false;
        } else if( !this.selectedOptions.querySelector('ul > li') ) {
            this.toggleNotification(true, 'Please select at least 1 schedule');
            return false;
        }
        const classList = this.classScheduler.classList;
        if( !classList.contains('cs-show-output') ) {
            this.updateOutput();
            classList.add('cs-show-output');
            this.outputContainer.style.height = `${this.inputContainer.offsetHeight}px`;
            this.toggleNotification(false);
        } else {
            // input field auto focus
            if( event.target.hasAttribute('data-input-item') ) {
                const input = this.inputContainer.querySelector(`input[data-item="${event.target.getAttribute('data-input-item')}"]`);
                input && input.focus();
            }
            classList.remove('cs-show-output');
        }
        // lock input content width
        const inputChildren = classList.contains('cs-show-output') ? this.inputContainer.children : this.outputContainer.children;
        const visibleContainer =  classList.contains('cs-show-output') ? this.inputContainer : this.outputContainer;
        const width = visibleContainer.offsetWidth - 60;
        for( let i = 0; i < inputChildren.length; i++ ) {
            inputChildren[i].style.minWidth = `${width}px`;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }



    // remove the output content min-width styles on transitionend event
    outputTransitionEnd = () => {
        const inputChildren = !this.classScheduler.classList.contains('cs-show-output') ? this.inputContainer.children : this.outputContainer.children;
        for( let i = 0; i < inputChildren.length; i++ ) {
            inputChildren[i].style.minWidth = '';
        }
        if( !this.classScheduler.classList.contains('cs-show-output') ) {
            this.outputContainer.style.height = '';
        }
    }


    // update output with form data
    updateOutput = () => {
        const formDataItems = this.inputContainer.querySelectorAll('[data-item]');
        let dataItemsHTML = '';
        for( let i = 0; i < formDataItems.length; i++ ) {
            const value = !formDataItems[i].value ? formDataItems[i].getAttribute('data-item-value') : formDataItems[i].value;
            dataItemsHTML += !value ? '' : `<li data-input-item="${formDataItems[i].getAttribute('data-item')}"><span class="label">${formDataItems[i].getAttribute('data-item')}</span><span class="value">${value}</span></li>`;
        }
        this.outputLabelAndValueList.innerHTML = dataItemsHTML;
    }


    // convert form data to object
    serializeForm = (formEl) => {
        const inputs = formEl.querySelectorAll('input[name]');
        const formData = {info: [], schedule: []};
        for( let i = 0; i < inputs.length; i++ ) {
            const nameValue = {name: inputs[i].name, value: inputs[i].value}
            !inputs[i].hasAttribute('data-input-schedule') ? formData.info.push(nameValue) : formData.schedule.push(nameValue);
        }
        return formData;
    }


    // log serialized form data to the console and submit the form (commented out).
    submitForm = () => {
        console.log(this.serializeForm(this.inputContainer)); 
        // this.inputContainer.submit();
    }


    // show or hide notification message
    toggleNotification = (show, message) => {
        window.clearTimeout(this.notificationTimeout);
        if( !show ) {
            this.classScheduler.classList.remove('show-notification');
        } else {
            this.classScheduler.setAttribute('data-notification', message);
            this.classScheduler.classList.add('show-notification');
            this.notificationTimeout = window.setTimeout(() => {
                this.classScheduler.classList.remove('show-notification');
            }, 5000);
        }
    }
}

const CS = new classScheduler(document.querySelector('.class-scheduler'));