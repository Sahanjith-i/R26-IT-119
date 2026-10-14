import { useEffect, useState } from "react";

function AlertPopup({ alert, type = "DANGER", onClose }) {

  const [visible, setVisible] = useState(false);

  useEffect(() => {

    if (!alert) {
      setVisible(false);
      return;
    }

    setVisible(true);

    // Automatically hide after 10 seconds
    const timer = setTimeout(() => {
      setVisible(false);

      if (onClose) {
        onClose();
      }

    }, 10000);

    return () => clearTimeout(timer);

  }, [alert, onClose]);


  if (!visible || !alert) {
    return null;
  }


  // =====================================================
  // ALERT TYPE
  // =====================================================

  const alertType =
    type?.toUpperCase() || "DANGER";


  const isSOS =
    alertType === "SOS";


  const isDanger =
    alertType === "DANGER";


  const isWarning =
    alertType === "WARNING";


  // =====================================================
  // STYLE
  // =====================================================

  let containerClass = "";
  let icon = "";
  let title = "";
  let subtitle = "";


  if (isSOS) {

    containerClass =
      "bg-red-600 border-red-400 shadow-red-900/60";

    icon = "🚨";

    title = "SOS EMERGENCY";

    subtitle =
      "Miner has manually activated the emergency button.";

  }

  else if (isDanger) {

    containerClass =
      "bg-red-600 border-red-400 shadow-red-900/60";

    icon = "🔴";

    title = "DANGER ALERT";

    subtitle =
      "Critical condition detected.";

  }

  else if (isWarning) {

    containerClass =
      "bg-yellow-500 border-yellow-300 shadow-yellow-900/40";

    icon = "⚠️";

    title = "WARNING ALERT";

    subtitle =
      "Abnormal sensor reading detected.";

  }

  else {

    containerClass =
      "bg-green-600 border-green-400 shadow-green-900/40";

    icon = "🟢";

    title = "SAFE";

    subtitle =
      "Miner condition is currently safe.";

  }


  // =====================================================
  // UI
  // =====================================================

  return (

    <div
      className="
        fixed
        top-6
        right-6
        z-[9999]
        w-[380px]
        max-w-[calc(100vw-32px)]
      "
    >

      <div
        className={`
          ${containerClass}
          border
          rounded-2xl
          shadow-2xl
          p-5
          text-white
          animate-[slideIn_0.3s_ease-out]
        `}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-start gap-4">

          {/* ICON */}

          <div
            className={`
              w-14
              h-14
              rounded-xl
              bg-black/20
              flex
              items-center
              justify-center
              text-3xl
              shrink-0
              ${isSOS || isDanger ? "animate-pulse" : ""}
            `}
          >

            {icon}

          </div>


          {/* TEXT */}

          <div className="flex-1">

            <div className="flex items-start justify-between gap-2">

              <h2 className="text-lg font-extrabold">
                {title}
              </h2>


              {/* CLOSE */}

              <button
                onClick={() => {

                  setVisible(false);

                  if (onClose) {
                    onClose();
                  }

                }}
                className="
                  text-white/70
                  hover:text-white
                  text-xl
                  leading-none
                "
              >

                ×

              </button>

            </div>


            <p className="text-sm text-white/90 mt-1">
              {subtitle}
            </p>

          </div>

        </div>


        {/* =================================================
            ALERT MESSAGE
        ================================================= */}

        <div className="
          mt-4
          bg-black/15
          rounded-xl
          px-4
          py-3
        ">

          <p className="text-sm font-semibold">
            {alert}
          </p>

        </div>


        {/* =================================================
            EMERGENCY INFORMATION
        ================================================= */}

        {isSOS && (

          <div className="
            mt-4
            bg-black/20
            rounded-xl
            p-3
          ">

            <p className="text-xs uppercase tracking-wider font-bold">
              Immediate Action Required
            </p>

            <p className="text-sm mt-1 text-white/90">
              Check the miner location and respond to the
              emergency situation immediately.
            </p>

          </div>

        )}


        {/* =================================================
            WARNING INFORMATION
        ================================================= */}

        {isWarning && (

          <div className="
            mt-4
            bg-black/15
            rounded-xl
            p-3
          ">

            <p className="text-xs font-semibold">
              Monitor the miner's sensor readings.
            </p>

          </div>

        )}


        {/* =================================================
            DANGER INFORMATION
        ================================================= */}

        {isDanger && !isSOS && (

          <div className="
            mt-4
            bg-black/20
            rounded-xl
            p-3
          ">

            <p className="text-xs font-semibold">
              Critical sensor condition detected.
            </p>

            <p className="text-xs mt-1 text-white/80">
              Check the miner and take appropriate emergency
              action.
            </p>

          </div>

        )}


        {/* =================================================
            PROGRESS BAR
        ================================================= */}

        <div className="
          mt-4
          h-1
          bg-black/20
          rounded-full
          overflow-hidden
        ">

          <div
            className="
              h-full
              bg-white/80
              animate-[shrink_10s_linear_forwards]
            "
          />

        </div>

      </div>


      {/* ===================================================
          ANIMATION
      =================================================== */}

      <style>
        {`
          @keyframes slideIn {

            from {
              opacity: 0;
              transform: translateX(30px);
            }

            to {
              opacity: 1;
              transform: translateX(0);
            }

          }

          @keyframes shrink {

            from {
              width: 100%;
            }

            to {
              width: 0%;
            }

          }
        `}
      </style>

    </div>

  );

}

export default AlertPopup;