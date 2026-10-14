import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import axios from "axios";
import io from "socket.io-client";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";


// =====================================================
// SOCKET CONNECTION
// =====================================================

const socket = io("http://localhost:5000");


// =====================================================
// API BASE URL
// =====================================================

const API_BASE_URL = "http://localhost:5000";


// =====================================================
// HELPERS
// =====================================================

const isValidNumber = (value) => {
  return (
    value !== undefined &&
    value !== null &&
    value !== "" &&
    !Number.isNaN(Number(value))
  );
};


const formatNumber = (value, decimals = 1) => {
  if (!isValidNumber(value)) {
    return null;
  }

  return Number(value).toFixed(decimals);
};


const formatDateTime = (value) => {
  if (!value) {
    return "No data";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No data";
  }

  return date.toLocaleString();
};


// =====================================================
// MAIN COMPONENT
// =====================================================

function MinerDetails() {

  const {
    id
  } = useParams();

  const navigate =
    useNavigate();


  const [
    miner,
    setMiner
  ] = useState(null);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  // ===================================================
  // FETCH MINER
  // ===================================================

  useEffect(() => {

    let mounted = true;


    const fetchMiner = async () => {

      try {

        const response =
          await axios.get(
            `${API_BASE_URL}/api/miners/${id}`
          );


        if (!mounted) {
          return;
        }


        /*
         * Backend may return:
         *
         * {
         *   success: true,
         *   miner: {...}
         * }
         *
         * OR directly:
         *
         * {
         *   userId: "MINER_01",
         *   ...
         * }
         */

        const responseData =
          response.data;


        const minerData =
          responseData?.miner ||
          responseData?.data ||
          responseData;


        setMiner(minerData);

        setError("");

        setLoading(false);

      } catch (err) {

        console.error(
          "Failed to load miner:",
          err
        );


        if (!mounted) {
          return;
        }


        setError(
          err?.response?.data?.message ||
          "Unable to load miner."
        );

        setLoading(false);
      }
    };


    fetchMiner();


    // =================================================
    // POLLING
    // =================================================

    const interval =
      setInterval(
        fetchMiner,
        5000
      );


    // =================================================
    // SOCKET UPDATE
    // =================================================

    const handleDataUpdate =
      (updatedData) => {

        if (!updatedData) {
          return;
        }


        const updatedMiner =
          updatedData?.miner ||
          updatedData?.data ||
          updatedData;


        if (
          updatedMiner?.userId === id ||
          updatedMiner?._id === id
        ) {

          setMiner(
            updatedMiner
          );

          setLoading(false);

          setError("");
        }
      };


    socket.on(
      "dataUpdate",
      handleDataUpdate
    );


    return () => {

      mounted = false;

      clearInterval(
        interval
      );

      socket.off(
        "dataUpdate",
        handleDataUpdate
      );

    };

  }, [id]);


  // ===================================================
  // DELETE MINER
  // ===================================================

  const deleteMiner = async () => {

    if (!miner) {
      return;
    }


    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${miner.userId}?`
      );


    if (!confirmed) {
      return;
    }


    try {

      await axios.delete(
        `${API_BASE_URL}/api/miners/${id}`
      );


      alert(
        "Miner deleted successfully."
      );


      navigate(
        "/miners"
      );

    } catch (err) {

      console.error(
        "Delete error:",
        err
      );


      alert(
        err?.response?.data?.message ||
        "Failed to delete miner."
      );

    }
  };


  // ===================================================
  // LOADING
  // ===================================================

  if (loading && !miner) {

    return (
      <div className="
        min-h-screen
        bg-slate-950
        text-white
        flex
      ">

        <Sidebar />

        <div className="
          ml-60
          w-full
        ">

          <Navbar />

          <main className="
            p-8
            min-h-screen
            flex
            items-center
            justify-center
          ">

            <div className="
              bg-slate-900
              border
              border-slate-800
              rounded-2xl
              p-12
              text-center
              max-w-lg
              w-full
            ">

              <div className="
                text-5xl
                mb-5
              ">
                ⏳
              </div>

              <h2 className="
                text-2xl
                font-bold
              ">
                Loading Miner
              </h2>

              <p className="
                text-slate-400
                mt-2
              ">
                Connecting to Central Control System...
              </p>

            </div>

          </main>

        </div>

      </div>
    );
  }


  // ===================================================
  // ERROR
  // ===================================================

  if (!miner) {

    return (
      <div className="
        min-h-screen
        bg-slate-950
        text-white
        flex
      ">

        <Sidebar />

        <div className="
          ml-60
          w-full
        ">

          <Navbar />

          <main className="
            min-h-screen
            flex
            items-center
            justify-center
            p-8
          ">

            <div className="
              bg-slate-900
              border
              border-red-500/40
              rounded-2xl
              p-10
              text-center
              max-w-xl
              w-full
            ">

              <div className="
                text-5xl
                mb-5
              ">
                ⚠️
              </div>

              <h1 className="
                text-2xl
                font-bold
              ">
                Unable to Load Miner
              </h1>

              <p className="
                text-slate-400
                mt-3
              ">
                {error ||
                  "Unable to load miner details."}
              </p>

              <button
                onClick={() =>
                  navigate("/miners")
                }
                className="
                  mt-6
                  bg-blue-600
                  hover:bg-blue-500
                  px-6
                  py-3
                  rounded-xl
                  font-bold
                "
              >
                ← Back to Miners
              </button>

            </div>

          </main>

        </div>

      </div>
    );
  }


  // ===================================================
  // STATUS
  // ===================================================

  const status =
    miner.status ||
    "SAFE";


  const isDanger =
    status === "DANGER";


  const isWarning =
    status === "WARNING";


  // ===================================================
  // SOS
  // ===================================================

  const sosActive =
    miner.sosAlert === true;


  // ===================================================
  // SENSOR VALUES
  // ===================================================

  const temperature =
    miner.temperature;


  const heartRate =
    miner.heartRate ??
    miner.bpm;


  const spo2 =
    miner.spo2;


  const motionStatus =
    miner.motionStatus ??
    miner.motion ??
    "NORMAL";


  const co2 =
    miner.co2;


  const ammonia =
    miner.ammonia ??
    miner.mq137;


  const methane =
    miner.mq4;


  const carbonMonoxide =
    miner.mq7;


  const pressure =
    miner.pressure;


  // ===================================================
  // SENSOR STATUS
  // ===================================================

  const sensorStatus =
    miner.sensorStatus ||
    {};


  const heartRateOnline =
    sensorStatus.heartRate === true;


  const spo2Online =
    sensorStatus.spo2 === true;


  const motionOnline =
    sensorStatus.motion === true;


  const temperatureOnline =
    sensorStatus.temperature === true;


  const co2Online =
    sensorStatus.co2 === true;


  const ammoniaOnline =
    sensorStatus.ammonia === true;


  const methaneOnline =
    sensorStatus.methane === true;


  const carbonMonoxideOnline =
    sensorStatus.carbonMonoxide === true;


  const pressureOnline =
    sensorStatus.pressure === true;


  // ===================================================
  // WARNING CONDITIONS
  // ===================================================

  const temperatureWarning =
    isValidNumber(temperature) &&
    Number(temperature) > 37.5;


  const heartRateWarning =
    isValidNumber(heartRate) &&
    (
      Number(heartRate) > 130 ||
      Number(heartRate) < 50
    );


  const co2Warning =
    isValidNumber(co2) &&
    Number(co2) > 1000;


  // ===================================================
  // JACKET CONNECTION
  // ===================================================

  const lastCommunication =
    miner.lastSensorUpdate ||
    miner.lastLoRaPacket ||
    miner.lastReceiverUpdate;


  const communicationAge =
    lastCommunication
      ? Date.now() -
        new Date(
          lastCommunication
        ).getTime()
      : Infinity;


  /*
   * Jacket is ONLINE only if:
   *
   * 1. A recent packet was received
   * 2. LoRa or ESP32 reports connected
   *
   * 30 seconds timeout.
   */

  const recentCommunication =
    communicationAge <= 30000;


  const jacketConnected =
    recentCommunication &&
    (
      miner.loraConnected === true ||
      miner.esp32Connected === true
    );


  // ===================================================
  // LORA LOCATION
  // ===================================================

  /*
   * IMPORTANT
   *
   * GPS latitude/longitude are NOT used.
   *
   * Location comes from LoRa RSSI.
   */

  const locationTracking =
    miner.locationTracking === true ||
    miner.locationMethod === "LORA_RSSI" ||
    miner.locationSource === "LORA_RSSI";


  const estimatedLocation =
    miner.estimatedLocation ||
    "Location Unknown";


  const nearestReceiver =
    miner.nearestReceiver ||
    "No Receiver";


  const strongestRSSI =
    miner.strongestRSSI ??
    miner.loraRssi ??
    null;


  const loraSnr =
    miner.loraSnr ??
    miner.snr ??
    null;


  const distance =
    miner.distance ??
    miner.locationDistance ??
    null;


  const direction =
    miner.direction ??
    miner.locationDirection ??
    "Unknown";


  const estimatedX =
    miner.estimatedX ??
    null;


  const estimatedY =
    miner.estimatedY ??
    null;


  const hasLocation =
    locationTracking &&
    (
      Boolean(
        miner.estimatedLocation
      ) ||
      Boolean(
        miner.nearestReceiver
      ) ||
      isValidNumber(
        strongestRSSI
      ) ||
      isValidNumber(
        estimatedX
      ) ||
      isValidNumber(
        estimatedY
      )
    );


  // ===================================================
  // RECEIVER DATA
  // ===================================================

  const receiverRSSI =
    miner.receiverRSSI ||
    {};


  const receiverDistances =
    miner.receiverDistances ||
    {};


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="
      flex
      min-h-screen
      bg-slate-950
      text-white
    ">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar />


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="
        ml-60
        w-full
      ">

        <Navbar />


        <main className="
          p-6
          md:p-8
          min-h-screen
          bg-slate-950
        ">

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-5
            mb-8
          ">

            <div>

              <p className="
                text-cyan-400
                text-sm
                font-semibold
                uppercase
                tracking-wider
              ">
                Central Control System
              </p>

              <h1 className="
                text-3xl
                md:text-4xl
                font-bold
                mt-1
              ">
                Miner Details
              </h1>

              <p className="
                text-slate-400
                mt-2
              ">
                Real-time miner safety monitoring
              </p>

            </div>


            {/* STATUS */}

            <div
              className={`
                px-6
                py-3
                rounded-2xl
                border
                font-bold
                flex
                items-center
                gap-3

                ${
                  isDanger
                    ? "bg-red-500/15 border-red-500/40 text-red-400"
                    : isWarning
                    ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
                    : "bg-green-500/15 border-green-500/40 text-green-400"
                }
              `}
            >

              <span
                className={`
                  w-3
                  h-3
                  rounded-full

                  ${
                    isDanger
                      ? "bg-red-500 animate-pulse"
                      : isWarning
                      ? "bg-yellow-400 animate-pulse"
                      : "bg-green-500"
                  }
                `}
              />

              {status}

            </div>

          </div>


          {/* =================================================
              SOS ALERT
          ================================================= */}

          {sosActive && (

            <div className="
              mb-8
              bg-red-600/15
              border
              border-red-500
              rounded-2xl
              p-6
              animate-pulse
            ">

              <div className="
                flex
                flex-col
                md:flex-row
                md:items-center
                md:justify-between
                gap-5
              ">

                <div className="
                  flex
                  items-center
                  gap-4
                ">

                  <div className="
                    w-16
                    h-16
                    rounded-2xl
                    bg-red-600
                    flex
                    items-center
                    justify-center
                    text-3xl
                  ">
                    🚨
                  </div>

                  <div>

                    <p className="
                      text-red-400
                      text-sm
                      font-bold
                      uppercase
                    ">
                      Emergency Alert
                    </p>

                    <h2 className="
                      text-2xl
                      font-bold
                    ">
                      SOS BUTTON ACTIVATED
                    </h2>

                    <p className="
                      text-red-200/80
                      mt-1
                    ">
                      Miner {miner.userId}
                      has triggered an emergency.
                    </p>

                  </div>

                </div>


                <div className="
                  bg-red-600
                  px-5
                  py-3
                  rounded-xl
                  font-bold
                ">
                  ACTIVE SOS
                </div>

              </div>

            </div>

          )}


          {/* =================================================
              MINER INFORMATION
          ================================================= */}

          <section className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-6
            mb-8
          ">

            <div className="
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-5
            ">

              <div>

                <p className="
                  text-slate-400
                  text-sm
                ">
                  MINER ID
                </p>

                <h2 className="
                  text-3xl
                  font-bold
                  text-white
                  mt-1
                ">
                  {miner.userId}
                </h2>

                <p className="
                  text-slate-400
                  mt-1
                ">
                  {miner.fullName ||
                    "Miner Name Not Available"}
                </p>

              </div>


              <div className="
                flex
                flex-wrap
                gap-3
              ">

                {/* JACKET */}

                <ConnectionBadge
                  label="Jacket"
                  online={jacketConnected}
                />


                {/* LORA */}

                <ConnectionBadge
                  label="LoRa"
                  online={
                    miner.loraConnected === true &&
                    recentCommunication
                  }
                />


                {/* ESP32 */}

                <ConnectionBadge
                  label="ESP32"
                  online={
                    miner.esp32Connected === true &&
                    recentCommunication
                  }
                />

              </div>

            </div>

          </section>


          {/* =================================================
              PERSONAL DETAILS
          ================================================= */}

          <section className="mb-8">

            <SectionHeader
              small="Miner Profile"
              title="👷 Personal Details"
            />

            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              xl:grid-cols-3
              gap-4
            ">

              <InfoCard
                label="Full Name"
                value={
                  miner.fullName ||
                  "Not Available"
                }
              />

              <InfoCard
                label="Age"
                value={
                  miner.age ??
                  "Not Available"
                }
              />

              <InfoCard
                label="NIC"
                value={
                  miner.nic ||
                  "Not Available"
                }
              />

              <InfoCard
                label="Miner Phone"
                value={
                  miner.minerPhone ||
                  "Not Available"
                }
              />

              <InfoCard
                label="Emergency Phone"
                value={
                  miner.emergencyPhone ||
                  "Not Available"
                }
                danger
              />

              <InfoCard
                label="Address"
                value={
                  miner.address ||
                  "Not Available"
                }
              />

            </div>


            <div className="
              flex
              flex-wrap
              gap-3
              mt-5
            ">

              <button
                onClick={() =>
                  navigate(
                    `/edit-miner/${id}`
                  )
                }
                className="
                  bg-yellow-500
                  hover:bg-yellow-400
                  text-black
                  px-5
                  py-3
                  rounded-xl
                  font-bold
                "
              >
                ✏️ Edit Miner
              </button>


              <button
                onClick={deleteMiner}
                className="
                  bg-red-600
                  hover:bg-red-500
                  text-white
                  px-5
                  py-3
                  rounded-xl
                  font-bold
                "
              >
                🗑 Delete Miner
              </button>

            </div>

          </section>


          {/* =================================================
              HEALTH MONITORING
          ================================================= */}

          <section className="mb-8">

            <SectionHeader
              small="Wearable Health Monitoring"
              title="❤️ Health Monitoring"
            />

            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              xl:grid-cols-4
              gap-5
            ">

              <SensorCard
                icon="❤️"
                title="Heart Rate"
                sensor="Pulse Sensor"
                value={
                  isValidNumber(
                    heartRate
                  )
                    ? `${heartRate} BPM`
                    : "--"
                }
                online={
                  heartRateOnline
                }
                warning={
                  heartRateWarning
                }
              />


              <SensorCard
                icon="🩸"
                title="SpO₂"
                sensor="MAX30102"
                value={
                  isValidNumber(
                    spo2
                  )
                    ? `${spo2}%`
                    : "--"
                }
                online={
                  spo2Online
                }
              />


              <SensorCard
                icon="🌡️"
                title="Temperature"
                sensor="GY-906 MLX90614"
                value={
                  isValidNumber(
                    temperature
                  )
                    ? `${temperature}°C`
                    : "--"
                }
                online={
                  temperatureOnline
                }
                warning={
                  temperatureWarning
                }
              />


              <SensorCard
                icon="🏃"
                title="Motion"
                sensor="MPU6050"
                value={
                  motionStatus
                }
                online={
                  motionOnline
                }
                warning={
                  miner.fallDetected === true
                }
              />

            </div>

          </section>


          {/* =================================================
              ENVIRONMENTAL MONITORING
          ================================================= */}

          <section className="mb-8">

            <SectionHeader
              small="Mine Environment"
              title="🌫 Environmental Monitoring"
            />

            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              xl:grid-cols-4
              gap-5
            ">

              <SensorCard
                icon="🧪"
                title="Ammonia"
                sensor="MQ135"
                value={
                  isValidNumber(
                    ammonia
                  )
                    ? ammonia
                    : "--"
                }
                online={
                  ammoniaOnline
                }
              />


              <SensorCard
                icon="🔥"
                title="Methane"
                sensor="MQ4"
                value={
                  isValidNumber(
                    methane
                  )
                    ? methane
                    : "--"
                }
                online={
                  methaneOnline
                }
              />


              <SensorCard
                icon="☣️"
                title="Carbon Monoxide"
                sensor="MQ7"
                value={
                  isValidNumber(
                    carbonMonoxide
                  )
                    ? carbonMonoxide
                    : "--"
                }
                online={
                  carbonMonoxideOnline
                }
              />


              <SensorCard
                icon="🌬️"
                title="Carbon Dioxide"
                sensor="CO₂"
                value={
                  isValidNumber(
                    co2
                  )
                    ? `${co2} ppm`
                    : "--"
                }
                online={
                  co2Online
                }
                warning={
                  co2Warning
                }
              />

            </div>

          </section>


          {/* =================================================
              PRESSURE + COMMUNICATION
          ================================================= */}

          <section className="mb-8">

            <SectionHeader
              small="System Monitoring"
              title="⚙️ Jacket System"
            />

            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              xl:grid-cols-4
              gap-5
            ">

              <SensorCard
                icon="📊"
                title="Pressure"
                sensor="BMP280"
                value={
                  isValidNumber(
                    pressure
                  )
                    ? `${pressure} hPa`
                    : "--"
                }
                online={
                  pressureOnline
                }
              />


              <SystemCard
                icon="📡"
                title="LoRa Communication"
                value={
                  miner.loraConnected === true &&
                  recentCommunication
                    ? "ONLINE"
                    : "OFFLINE"
                }
                online={
                  miner.loraConnected === true &&
                  recentCommunication
                }
              />


              <SystemCard
                icon="🧠"
                title="ESP32 Controller"
                value={
                  miner.esp32Connected === true &&
                  recentCommunication
                    ? "ONLINE"
                    : "OFFLINE"
                }
                online={
                  miner.esp32Connected === true &&
                  recentCommunication
                }
              />


              <SystemCard
                icon="🚨"
                title="SOS Button"
                value={
                  sosActive
                    ? "ACTIVE"
                    : "READY"
                }
                online={
                  !sosActive
                }
                danger={
                  sosActive
                }
              />

            </div>

          </section>


          {/* =================================================
              ALERT OUTPUTS
          ================================================= */}

          <section className="mb-8">

            <SectionHeader
              small="Emergency Response"
              title="🚨 Alert Outputs"
            />

            <div className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-5
            ">

              <OutputCard
                icon="💡"
                title="LED Indicator"
                active={
                  miner.ledAlert === true
                }
              />


              <OutputCard
                icon="🔊"
                title="Buzzer"
                active={
                  miner.buzzerAlert === true
                }
              />


              <OutputCard
                icon="📳"
                title="Vibration Motor"
                active={
                  miner.vibrationAlert === true
                }
              />

            </div>

          </section>


          {/* =================================================
              📍 LORA LOCATION
          ================================================= */}

          <section className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-6
            mb-8
            shadow-xl
          ">

            <div className="
              flex
              flex-col
              lg:flex-row
              lg:items-start
              lg:justify-between
              gap-6
            ">

              <div className="w-full">

                <p className="
                  text-cyan-400
                  text-sm
                  font-semibold
                  uppercase
                  tracking-wider
                ">
                  Miner Location
                </p>


                <h2 className="
                  text-2xl
                  font-bold
                  mt-1
                ">
                  📍 Live Location
                </h2>


                {/* =========================================
                    LOCATION AVAILABLE
                ========================================= */}

                {hasLocation ? (

                  <div className="mt-5">

                    {/* MAIN LOCATION */}

                    <div className="
                      bg-cyan-500/10
                      border
                      border-cyan-500/30
                      rounded-xl
                      p-5
                    ">

                      <p className="
                        text-xs
                        text-slate-500
                        uppercase
                        tracking-wider
                      ">
                        Estimated Miner Location
                      </p>


                      <p className="
                        text-2xl
                        font-bold
                        text-cyan-400
                        mt-2
                      ">
                        📍 {estimatedLocation}
                      </p>


                      <div className="
                        grid
                        grid-cols-1
                        sm:grid-cols-2
                        lg:grid-cols-5
                        gap-4
                        mt-6
                      ">

                        {/* RECEIVER */}

                        <LocationItem
                          label="Nearest Receiver"
                          value={
                            `📡 ${nearestReceiver}`
                          }
                          color="text-green-400"
                        />


                        {/* RSSI */}

                        <LocationItem
                          label="LoRa RSSI"
                          value={
                            isValidNumber(
                              strongestRSSI
                            )
                              ? `${strongestRSSI} dBm`
                              : "N/A"
                          }
                          color="text-yellow-400"
                        />


                        {/* SNR */}

                        <LocationItem
                          label="LoRa SNR"
                          value={
                            isValidNumber(
                              loraSnr
                            )
                              ? `${loraSnr} dB`
                              : "N/A"
                          }
                          color="text-blue-400"
                        />


                        {/* DIRECTION */}

                        <LocationItem
                          label="Direction"
                          value={
                            `🧭 ${direction}`
                          }
                          color="text-purple-400"
                        />


                        {/* DISTANCE */}

                        <LocationItem
                          label="Distance"
                          value={
                            isValidNumber(
                              distance
                            )
                              ? `${formatNumber(
                                  distance,
                                  1
                                )} m`
                              : "N/A"
                          }
                          color="text-orange-400"
                        />

                      </div>

                    </div>


                    {/* =====================================
                        RECEIVERS
                    ===================================== */}

                    <div className="
                      grid
                      grid-cols-1
                      md:grid-cols-3
                      gap-4
                      mt-4
                    ">

                      <ReceiverCard
                        receiver="R1"
                        zone="Mine Zone A"
                        rssi={
                          receiverRSSI.R1
                        }
                        distance={
                          receiverDistances.R1
                        }
                        nearest={
                          nearestReceiver === "R1"
                        }
                      />


                      <ReceiverCard
                        receiver="R2"
                        zone="Mine Zone B"
                        rssi={
                          receiverRSSI.R2
                        }
                        distance={
                          receiverDistances.R2
                        }
                        nearest={
                          nearestReceiver === "R2"
                        }
                      />


                      <ReceiverCard
                        receiver="R3"
                        zone="Mine Zone C"
                        rssi={
                          receiverRSSI.R3
                        }
                        distance={
                          receiverDistances.R3
                        }
                        nearest={
                          nearestReceiver === "R3"
                        }
                      />

                    </div>


                    {/* =====================================
                        X / Y
                    ===================================== */}

                    {(isValidNumber(estimatedX) ||
                      isValidNumber(estimatedY)) && (

                      <div className="
                        grid
                        grid-cols-1
                        md:grid-cols-2
                        gap-4
                        mt-4
                      ">

                        <div className="
                          bg-slate-800
                          border
                          border-slate-700
                          rounded-xl
                          p-4
                        ">

                          <p className="
                            text-xs
                            text-slate-500
                            uppercase
                          ">
                            Estimated X Position
                          </p>

                          <p className="
                            text-xl
                            font-bold
                            text-white
                            mt-2
                          ">
                            {isValidNumber(
                              estimatedX
                            )
                              ? formatNumber(
                                  estimatedX,
                                  2
                                )
                              : "N/A"}
                          </p>

                        </div>


                        <div className="
                          bg-slate-800
                          border
                          border-slate-700
                          rounded-xl
                          p-4
                        ">

                          <p className="
                            text-xs
                            text-slate-500
                            uppercase
                          ">
                            Estimated Y Position
                          </p>

                          <p className="
                            text-xl
                            font-bold
                            text-white
                            mt-2
                          ">
                            {isValidNumber(
                              estimatedY
                            )
                              ? formatNumber(
                                  estimatedY,
                                  2
                                )
                              : "N/A"}
                          </p>

                        </div>

                      </div>

                    )}


                    {/* TRACKING STATUS */}

                    <div className="
                      flex
                      items-center
                      gap-3
                      mt-5
                    ">

                      <span className="
                        w-3
                        h-3
                        rounded-full
                        bg-green-500
                        animate-pulse
                      " />

                      <span className="
                        text-green-400
                        font-semibold
                      ">
                        LoRa RSSI Location Tracking Active
                      </span>

                    </div>

                  </div>

                ) : (

                  /* =======================================
                     LOCATION UNAVAILABLE
                  ======================================= */

                  <div className="
                    mt-5
                    bg-yellow-500/10
                    border
                    border-yellow-500/30
                    rounded-xl
                    p-5
                  ">

                    <p className="
                      text-yellow-400
                      font-semibold
                    ">
                      ⚠ Location data unavailable
                    </p>

                    <p className="
                      text-slate-400
                      text-sm
                      mt-2
                    ">
                      Waiting for LoRa receiver data
                      from this miner.
                    </p>

                    <p className="
                      text-slate-500
                      text-xs
                      mt-3
                    ">
                      GPS latitude / longitude is
                      not required for this system.
                    </p>

                  </div>

                )}

              </div>


              {/* =========================================
                  MAP BUTTON
              ========================================= */}

              {hasLocation && (

                <button
                  onClick={() =>
                    navigate(
                      `/map/${miner.userId}`
                    )
                  }
                  className="
                    bg-cyan-500
                    hover:bg-cyan-400
                    text-slate-950
                    px-6
                    py-3
                    rounded-xl
                    font-bold
                    transition
                    whitespace-nowrap
                  "
                >
                  🗺️ View On Map
                </button>

              )}

            </div>

          </section>


          {/* =================================================
              LAST COMMUNICATION
          ================================================= */}

          <section className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-6
            mb-8
          ">

            <p className="
              text-cyan-400
              text-sm
              font-semibold
              uppercase
            ">
              Communication
            </p>

            <h2 className="
              text-2xl
              font-bold
              mt-1
              mb-5
            ">
              📡 Last Updates
            </h2>


            <div className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-4
            ">

              <TimeCard
                label="Last Sensor Update"
                value={
                  miner.lastSensorUpdate
                }
              />


              <TimeCard
                label="Last LoRa Packet"
                value={
                  miner.lastLoRaPacket
                }
              />


              <TimeCard
                label="Last Receiver Update"
                value={
                  miner.lastReceiverUpdate
                }
              />

            </div>

          </section>


          {/* =================================================
              FOOTER STATUS
          ================================================= */}

          <div className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            px-6
            py-4
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-3
          ">

            <div className="
              flex
              items-center
              gap-3
            ">

              <span
                className={`
                  w-3
                  h-3
                  rounded-full

                  ${
                    jacketConnected
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-500"
                  }
                `}
              />

              <span className="
                text-sm
                text-slate-300
              ">
                Jacket:
                {" "}
                <span
                  className={
                    jacketConnected
                      ? "text-green-400 font-bold"
                      : "text-red-400 font-bold"
                  }
                >
                  {jacketConnected
                    ? "ONLINE"
                    : "OFFLINE"}
                </span>
              </span>

            </div>


            <p className="
              text-sm
              text-slate-500
            ">
              Real-time monitoring via LoRa / ESP32
            </p>

          </div>

        </main>

      </div>

    </div>
  );
}


// =====================================================
// SECTION HEADER
// =====================================================

function SectionHeader({
  small,
  title
}) {
  return (
    <div className="mb-5">

      <p className="
        text-cyan-400
        text-sm
        font-semibold
        uppercase
        tracking-wider
      ">
        {small}
      </p>

      <h2 className="
        text-2xl
        font-bold
        mt-1
      ">
        {title}
      </h2>

    </div>
  );
}


// =====================================================
// INFO CARD
// =====================================================

function InfoCard({
  label,
  value,
  danger = false
}) {
  return (
    <div className="
      bg-slate-900
      border
      border-slate-800
      rounded-2xl
      p-5
    ">

      <p className="
        text-xs
        text-slate-500
        uppercase
        tracking-wider
      ">
        {label}
      </p>

      <p
        className={`
          text-lg
          font-semibold
          mt-2

          ${
            danger
              ? "text-red-400"
              : "text-white"
          }
        `}
      >
        {value}
      </p>

    </div>
  );
}


// =====================================================
// CONNECTION BADGE
// =====================================================

function ConnectionBadge({
  label,
  online
}) {
  return (
    <div className="
      bg-slate-800
      border
      border-slate-700
      px-4
      py-3
      rounded-xl
    ">

      <p className="
        text-xs
        text-slate-500
      ">
        {label}
      </p>

      <div className="
        flex
        items-center
        gap-2
        mt-1
      ">

        <span
          className={`
            w-2.5
            h-2.5
            rounded-full

            ${
              online
                ? "bg-green-500"
                : "bg-red-500"
            }
          `}
        />

        <span
          className={
            online
              ? "text-green-400 font-bold text-sm"
              : "text-red-400 font-bold text-sm"
          }
        >
          {online
            ? "ONLINE"
            : "OFFLINE"}
        </span>

      </div>

    </div>
  );
}


// =====================================================
// SENSOR CARD
// =====================================================

function SensorCard({
  icon,
  title,
  sensor,
  value,
  online,
  warning = false
}) {
  return (
    <div
      className={`
        rounded-2xl
        p-6
        border
        shadow-xl

        ${
          warning
            ? "bg-yellow-500/10 border-yellow-500/40"
            : "bg-slate-900 border-slate-800"
        }
      `}
    >

      <div className="
        flex
        justify-between
        items-start
      ">

        <div>

          <p className="
            text-slate-400
            text-sm
          ">
            {title}
          </p>

          <h3 className="
            text-lg
            font-bold
            mt-1
          ">
            {sensor}
          </h3>

        </div>

        <span className="text-2xl">
          {icon}
        </span>

      </div>


      <div className="
        flex
        items-center
        gap-2
        mt-5
      ">

        <span
          className={`
            w-2.5
            h-2.5
            rounded-full

            ${
              online
                ? "bg-green-500"
                : "bg-red-500"
            }
          `}
        />

        <span
          className={
            online
              ? "text-green-400 text-xs font-bold"
              : "text-red-400 text-xs font-bold"
          }
        >
          {online
            ? "ONLINE"
            : "OFFLINE"}
        </span>

      </div>


      <p className={`
        text-3xl
        font-bold
        mt-5

        ${
          online
            ? "text-white"
            : "text-slate-600"
        }
      `}>

        {online
          ? value
          : "--"}

      </p>


      <p className={`
        text-xs
        mt-3

        ${
          warning
            ? "text-yellow-400"
            : "text-slate-500"
        }
      `}>

        {!online
          ? "Sensor disconnected"
          : warning
          ? "⚠ Abnormal reading"
          : "✓ Monitoring active"}

      </p>

    </div>
  );
}


// =====================================================
// SYSTEM CARD
// =====================================================

function SystemCard({
  icon,
  title,
  value,
  online,
  danger = false
}) {
  return (
    <div
      className={`
        rounded-2xl
        p-6
        border
        shadow-xl

        ${
          danger
            ? "bg-red-500/10 border-red-500/40"
            : "bg-slate-900 border-slate-800"
        }
      `}
    >

      <div className="
        flex
        justify-between
        items-start
      ">

        <div>

          <p className="
            text-slate-400
            text-sm
          ">
            {title}
          </p>

          <p
            className={`
              text-3xl
              font-bold
              mt-5

              ${
                danger
                  ? "text-red-400"
                  : online
                  ? "text-green-400"
                  : "text-red-400"
              }
            `}
          >
            {value}
          </p>

        </div>

        <span className="text-2xl">
          {icon}
        </span>

      </div>

    </div>
  );
}


// =====================================================
// OUTPUT CARD
// =====================================================

function OutputCard({
  icon,
  title,
  active
}) {
  return (
    <div
      className={`
        rounded-2xl
        p-6
        border
        shadow-xl

        ${
          active
            ? "bg-red-500/15 border-red-500"
            : "bg-slate-900 border-slate-800"
        }
      `}
    >

      <div className="
        flex
        items-center
        justify-between
      ">

        <div className="
          flex
          items-center
          gap-4
        ">

          <div className="
            w-12
            h-12
            rounded-xl
            bg-slate-800
            flex
            items-center
            justify-center
            text-2xl
          ">
            {icon}
          </div>

          <div>

            <h3 className="
              font-bold
              text-lg
            ">
              {title}
            </h3>

            <p className="
              text-sm
              text-slate-400
            ">
              Emergency output
            </p>

          </div>

        </div>


        <span
          className={
            active
              ? "text-red-400 font-bold"
              : "text-green-400 font-bold"
          }
        >
          {active
            ? "ACTIVE"
            : "READY"}
        </span>

      </div>

    </div>
  );
}


// =====================================================
// LOCATION ITEM
// =====================================================

function LocationItem({
  label,
  value,
  color
}) {
  return (
    <div>

      <p className="
        text-xs
        text-slate-500
        uppercase
      ">
        {label}
      </p>

      <p
        className={`
          text-lg
          font-bold
          mt-1
          ${color}
        `}
      >
        {value}
      </p>

    </div>
  );
}


// =====================================================
// RECEIVER CARD
// =====================================================

function ReceiverCard({
  receiver,
  zone,
  rssi,
  distance,
  nearest
}) {
  const active =
    isValidNumber(rssi);


  return (
    <div
      className={`
        rounded-xl
        p-4
        border

        ${
          nearest
            ? "bg-cyan-500/10 border-cyan-500/40"
            : "bg-slate-800 border-slate-700"
        }
      `}
    >

      <div className="
        flex
        items-center
        justify-between
        gap-3
      ">

        <div>

          <p className="
            text-lg
            font-bold
          ">
            📡 {receiver}
          </p>

          <p className="
            text-sm
            text-slate-400
            mt-1
          ">
            {zone}
          </p>

        </div>


        {nearest && (

          <span className="
            text-xs
            bg-cyan-500
            text-slate-950
            px-2
            py-1
            rounded-full
            font-bold
          ">
            NEAREST
          </span>

        )}

      </div>


      <div className="
        grid
        grid-cols-2
        gap-3
        mt-4
      ">

        <div>

          <p className="
            text-xs
            text-slate-500
          ">
            RSSI
          </p>

          <p className="
            text-yellow-400
            font-bold
          ">
            {active
              ? `${rssi} dBm`
              : "N/A"}
          </p>

        </div>


        <div>

          <p className="
            text-xs
            text-slate-500
          ">
            Distance
          </p>

          <p className="
            text-orange-400
            font-bold
          ">
            {isValidNumber(
              distance
            )
              ? `${formatNumber(
                  distance,
                  1
                )} m`
              : "N/A"}
          </p>

        </div>

      </div>

    </div>
  );
}


// =====================================================
// TIME CARD
// =====================================================

function TimeCard({
  label,
  value
}) {
  return (
    <div className="
      bg-slate-800
      border
      border-slate-700
      rounded-xl
      p-4
    ">

      <p className="
        text-xs
        text-slate-500
        uppercase
      ">
        {label}
      </p>

      <p className="
        text-sm
        font-semibold
        text-slate-200
        mt-2
      ">
        {formatDateTime(value)}
      </p>

    </div>
  );
}


// =====================================================
// EXPORT
// =====================================================

export default MinerDetails;