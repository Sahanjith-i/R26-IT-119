import React from "react";
import { NavLink } from "react-router-dom";

function Sidebar() {
  const mainMenu = [
    {
      name: "Dashboard",
      path: "/",
      icon: "📊",
      end: true,
    },
    {
      name: "Miners",
      path: "/miners",
      icon: "👷",
    },
    {
      name: "Alerts",
      path: "/alerts",
      icon: "🚨",
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: "🔔",
    },
  ];

  const monitoringMenu = [
    {
      name: "Health Monitoring",
      path: "/health-monitoring",
      icon: "❤️",
      description: "Temperature & Heart",
    },
    {
      name: "Motion & Emergency",
      path: "/motion-emergency",
      icon: "🏃",
      description: "Motion & SOS",
    },
    {
      name: "Environmental",
      path: "/environmental-monitoring",
      icon: "🌫️",
      description: "Gas & Air Quality",
    },
    {
      name: "Miner Map",
      path: "/map",
      icon: "🗺️",
      description: "Live Location",
    },
  ];

  return (
    <aside
      className="
        fixed
        left-0
        top-0
        h-screen
        w-64
        bg-slate-950
        border-r
        border-slate-800
        text-white
        flex
        flex-col
        z-50
        overflow-hidden
      "
    >

      {/* =====================================================
          LOGO / SYSTEM HEADER
      ===================================================== */}

      <div
        className="
          h-20
          px-5
          border-b
          border-slate-800
          flex
          items-center
          shrink-0
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              w-11
              h-11
              rounded-xl
              bg-cyan-500/10
              border
              border-cyan-500/20
              flex
              items-center
              justify-center
              text-xl
              shadow-lg
              shadow-cyan-500/5
            "
          >
            🛡️
          </div>

          <div className="min-w-0">

            <h1
              className="
                font-bold
                text-sm
                text-white
                tracking-wide
              "
            >
              CENTRAL CONTROL
            </h1>

            <p
              className="
                text-[10px]
                text-slate-500
                uppercase
                tracking-wider
                mt-0.5
              "
            >
              Safety Management
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          SYSTEM STATUS
      ===================================================== */}

      <div className="px-4 pt-5 shrink-0">

        <div
          className="
            bg-green-500/10
            border
            border-green-500/20
            rounded-xl
            px-3
            py-3
            flex
            items-center
            gap-3
          "
        >

          <span className="relative flex h-3 w-3">

            <span
              className="
                animate-ping
                absolute
                inline-flex
                h-full
                w-full
                rounded-full
                bg-green-400
                opacity-75
              "
            />

            <span
              className="
                relative
                inline-flex
                rounded-full
                h-3
                w-3
                bg-green-500
              "
            />

          </span>

          <div>

            <p
              className="
                text-xs
                font-bold
                text-green-400
              "
            >
              SYSTEM ONLINE
            </p>

            <p
              className="
                text-[10px]
                text-slate-500
                mt-0.5
              "
            >
              Monitoring active
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav
        className="
          flex-1
          px-4
          py-6
          overflow-y-auto
          scrollbar-thin
        "
      >

        {/* ===================================================
            MAIN MENU
        =================================================== */}

        <p
          className="
            text-[10px]
            font-bold
            text-slate-600
            uppercase
            tracking-widest
            px-3
            mb-3
          "
        >
          Main Menu
        </p>

        <div className="space-y-2">

          {mainMenu.map((item) => (

            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `
                group
                flex
                items-center
                justify-between
                gap-3
                px-4
                py-3
                rounded-xl
                transition-all
                duration-200
                ${
                  isActive
                    ? `
                      bg-cyan-500/10
                      text-cyan-400
                      border
                      border-cyan-500/20
                      shadow-lg
                      shadow-cyan-500/5
                    `
                    : `
                      text-slate-400
                      hover:text-white
                      hover:bg-slate-900
                      border
                      border-transparent
                    `
                }
              `}
            >

              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 min-w-0">

                    <span
                      className={`
                        text-lg
                        w-6
                        text-center
                        transition-transform
                        duration-200
                        ${
                          isActive
                            ? "scale-110"
                            : "group-hover:scale-110"
                        }
                      `}
                    >
                      {item.icon}
                    </span>

                    <span
                      className="
                        text-sm
                        font-semibold
                        truncate
                      "
                    >
                      {item.name}
                    </span>

                  </div>

                  {isActive && (
                    <span
                      className="
                        w-1.5
                        h-1.5
                        rounded-full
                        bg-cyan-400
                        shrink-0
                      "
                    />
                  )}

                </>
              )}

            </NavLink>

          ))}

        </div>


        {/* ===================================================
            MONITORING
        =================================================== */}

        <div className="mt-8">

          <p
            className="
              text-[10px]
              font-bold
              text-slate-600
              uppercase
              tracking-widest
              px-3
              mb-3
            "
          >
            Monitoring
          </p>

          <div className="space-y-2">

            {monitoringMenu.map((item) => (

              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  group
                  block
                  rounded-xl
                  border
                  transition-all
                  duration-200
                  ${
                    isActive
                      ? `
                        bg-cyan-500/10
                        border-cyan-500/20
                        shadow-lg
                        shadow-cyan-500/5
                      `
                      : `
                        bg-slate-900/50
                        border-slate-800
                        hover:bg-slate-900
                        hover:border-slate-700
                      `
                  }
                `}
              >

                {({ isActive }) => (
                  <div className="px-3 py-3">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3 min-w-0">

                        <span
                          className={`
                            w-9
                            h-9
                            rounded-lg
                            flex
                            items-center
                            justify-center
                            text-base
                            border
                            transition
                            ${
                              isActive
                                ? `
                                  bg-cyan-500/10
                                  border-cyan-500/20
                                `
                                : `
                                  bg-slate-800
                                  border-slate-700
                                `
                            }
                          `}
                        >
                          {item.icon}
                        </span>

                        <div className="min-w-0">

                          <p
                            className={`
                              text-xs
                              font-bold
                              truncate
                              ${
                                isActive
                                  ? "text-cyan-400"
                                  : "text-slate-300"
                              }
                            `}
                          >
                            {item.name}
                          </p>

                          <p
                            className="
                              text-[9px]
                              text-slate-600
                              mt-0.5
                              truncate
                            "
                          >
                            {item.description}
                          </p>

                        </div>

                      </div>

                      {isActive ? (
                        <span
                          className="
                            w-1.5
                            h-1.5
                            rounded-full
                            bg-cyan-400
                            shrink-0
                          "
                        />
                      ) : (
                        <span
                          className="
                            w-1.5
                            h-1.5
                            rounded-full
                            bg-green-500/70
                            shrink-0
                          "
                        />
                      )}

                    </div>

                  </div>
                )}

              </NavLink>

            ))}

          </div>

        </div>


        {/* ===================================================
            NETWORK STATUS
        =================================================== */}

        <div className="mt-8">

          <p
            className="
              text-[10px]
              font-bold
              text-slate-600
              uppercase
              tracking-widest
              px-3
              mb-3
            "
          >
            System Network
          </p>

          <div className="space-y-2">

            {/* LoRa */}

            <div
              className="
                flex
                items-center
                justify-between
                px-4
                py-3
                rounded-xl
                bg-slate-900/60
                border
                border-slate-800
              "
            >

              <div className="flex items-center gap-3">

                <span className="text-lg">
                  📡
                </span>

                <div>

                  <p
                    className="
                      text-xs
                      font-semibold
                      text-slate-400
                    "
                  >
                    LoRa Network
                  </p>

                  <p
                    className="
                      text-[9px]
                      text-slate-600
                    "
                  >
                    SY-SX1278
                  </p>

                </div>

              </div>

              <span
                className="
                  w-2
                  h-2
                  rounded-full
                  bg-green-500
                  shadow-lg
                  shadow-green-500/50
                "
              />

            </div>


            {/* ESP32 */}

            <div
              className="
                flex
                items-center
                justify-between
                px-4
                py-3
                rounded-xl
                bg-slate-900/60
                border
                border-slate-800
              "
            >

              <div className="flex items-center gap-3">

                <span className="text-lg">
                  ⚡
                </span>

                <div>

                  <p
                    className="
                      text-xs
                      font-semibold
                      text-slate-400
                    "
                  >
                    ESP32 Gateway
                  </p>

                  <p
                    className="
                      text-[9px]
                      text-slate-600
                    "
                  >
                    Receiver Online
                  </p>

                </div>

              </div>

              <span
                className="
                  w-2
                  h-2
                  rounded-full
                  bg-green-500
                  shadow-lg
                  shadow-green-500/50
                "
              />

            </div>


            {/* GPS */}

            <div
              className="
                flex
                items-center
                justify-between
                px-4
                py-3
                rounded-xl
                bg-slate-900/60
                border
                border-slate-800
              "
            >

              <div className="flex items-center gap-3">

                <span className="text-lg">
                  🛰️
                </span>

                <div>

                  <p
                    className="
                      text-xs
                      font-semibold
                      text-slate-400
                    "
                  >
                    GPS Tracking
                  </p>

                  <p
                    className="
                      text-[9px]
                      text-slate-600
                    "
                  >
                    Location Service
                  </p>

                </div>

              </div>

              <span
                className="
                  w-2
                  h-2
                  rounded-full
                  bg-green-500
                  shadow-lg
                  shadow-green-500/50
                "
              />

            </div>

          </div>

        </div>

      </nav>


      {/* =====================================================
          ADMIN FOOTER
      ===================================================== */}

      <div
        className="
          p-4
          border-t
          border-slate-800
          shrink-0
        "
      >

        <div
          className="
            bg-slate-900
            rounded-xl
            border
            border-slate-800
            p-3
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                w-9
                h-9
                rounded-lg
                bg-cyan-500
                text-slate-950
                flex
                items-center
                justify-center
                font-bold
                shadow-lg
                shadow-cyan-500/20
              "
            >
              A
            </div>

            <div className="min-w-0">

              <p
                className="
                  text-sm
                  font-bold
                  truncate
                  text-white
                "
              >
                Admin
              </p>

              <p
                className="
                  text-[10px]
                  text-slate-500
                "
              >
                Control Operator
              </p>

            </div>

          </div>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;