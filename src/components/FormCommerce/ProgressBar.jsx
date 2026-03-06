import "./ProgressBar.css";

function ProgressBar({ steps, currentStep }) {
  return (
    <div className="progress-bar">
      {steps.map((step, index) => {
        const stepNum   = index + 1;
        const isActive    = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div
            key={index}
            className={`progress-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
          >
            <div className="step-number">
              {isCompleted ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10l4.5 4.5L16 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                stepNum
              )}
            </div>
            <div className="step-label">{step}</div>
          </div>
        );
      })}
    </div>
  );
}

export default ProgressBar;