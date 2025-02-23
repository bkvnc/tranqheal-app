export const assessmentStates = {
    
    FirstSet: {
        interest: null,
        feelingDown: null,
        sleepIssues: null,
        tiredness: null,
        appetite: null,
        feelingBad: null,
        concentration: null,
        movingSlowly: null,
        thoughts: null,
        feelingNervous: null,
        controlWorrying: null,
        tooMuchWorrying: null,
        troubleRelaxing: null,
        restlessness: null,
        irritable: null,
        afraid: null,
    },
    firstRadioOptions: [
        { id: '1', label: 'Not at all', value: '0' },
        { id: '2', label: 'Several days', value: '1' },
        { id: '3', label: 'More than half the days', value: '2' },
        { id: '4', label: 'Nearly every day', value: '3' },
    ],
    SecondSet: {
        upsetUnexpectedly: null, 
        unableControlThings: null,
        nervousAndStressed: null,
        handlePersonalProblems: null,
        thingsGoingYourWay: null,
        unableToCope: null,
        controlIrritations: null,
        onTopOfThings: null,
        angeredByThings: null,
        pilingUpDifficulties: null,
    },
    secondRadioOptions: [
        { id: '1', label: 'Never', value: '0' },
        { id: '2', label: 'Almost never', value: '1' },
        { id: '3', label: 'Sometimes', value: '2' },
        { id: '4', label: 'Fairly often', value: '3' },
        { id: '5', label: 'Very often', value: '4' },
    ]
};