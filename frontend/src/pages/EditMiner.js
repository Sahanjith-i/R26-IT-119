import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function EditMiner() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    nic: "",
    address: "",
    minerPhone: "",
    emergencyPhone: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // GET MINER
  // =====================================================

  useEffect(() => {
    const fetchMiner = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/miners/${id}`
        );

        const miner = response.data;

        setFormData({
          fullName: miner.fullName || "",
          age: miner.age || "",
          nic: miner.nic || "",
          address: miner.address || "",
          minerPhone: miner.minerPhone || "",
          emergencyPhone: miner.emergencyPhone || ""
        });

        setError("");
      } catch (err) {
        console.error("Failed to load miner:", err);
        setError("Unable to load miner details.");
      } finally {
        setLoading(false);
      }
    };

    fetchMiner();
  }, [id]);

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // =====================================================
  // UPDATE MINER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.fullName.trim()) {
      setError("Please enter the miner's full name.");
      return;
    }

    if (!formData.nic.trim()) {
      setError("Please enter the miner's NIC number.");
      return;
    }

    if (formData.age !== "") {
      const age = Number(formData.age);

      if (age < 18 || age > 100) {
        setError("Please enter a valid age between 18 and 100.");
        return;
      }
    }

    try {
      setSaving(true);

      await axios.put(
        `http://localhost:5000/api/miners/${id}`,
        {
          fullName: formData.fullName.trim(),
          age:
            formData.age === ""
              ? null
              : Number(formData.age),
          nic: formData.nic.trim(),
          address: formData.address.trim(),
          minerPhone: formData.minerPhone.trim(),
          emergencyPhone: formData.emergencyPhone.trim()
        }
      );

      alert("Miner details updated successfully.");

      navigate(`/miner/${id}`);
    } catch (err) {
      console.error("Update error:", err);

      setError(
        err.response?.data?.error ||
          "Failed to update miner details."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>

          <h2 className="text-xl font-bold">
            Loading Miner Details...
          </h2>

          <p className="text-slate-400 mt-2">
            Please wait
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">

      <div className="max-w-4xl mx-auto">

        {/* HEADER */}

        <div className="mb-8">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white mb-5 transition"
          >
            ← Back to Miner Details
          </button>

          <p className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">
            Central Control System
          </p>

          <h1 className="text-3xl md:text-4xl font-bold mt-1">
            Edit Miner
          </h1>

          <p className="text-slate-400 mt-2">
            Update miner personal and emergency contact information.
          </p>

        </div>


        {/* CARD */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

          {/* CARD HEADER */}

          <div className="px-6 md:px-8 py-6 border-b border-slate-800">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl">
                👷
              </div>

              <div>

                <p className="text-slate-500 text-xs uppercase">
                  Miner ID
                </p>

                <h2 className="text-xl font-bold text-cyan-400">
                  {id}
                </h2>

              </div>

            </div>

          </div>


          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="p-6 md:p-8"
          >

            {/* ERROR */}

            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 font-semibold">
                  ⚠️ {error}
                </p>
              </div>
            )}


            {/* PERSONAL DETAILS */}

            <div className="mb-8">

              <div className="mb-5">

                <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                  Personal Information
                </p>

                <h3 className="text-xl font-bold mt-1">
                  Miner Details
                </h3>

              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* NAME */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Full Name
                    <span className="text-red-400 ml-1">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    disabled={saving}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition"
                  />

                </div>


                {/* AGE */}

                <div>

                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Age
                  </label>

                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Enter age"
                    min="18"
                    max="100"
                    disabled={saving}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition"
                  />

                </div>


                {/* NIC */}

                <div>

                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    NIC Number
                    <span className="text-red-400 ml-1">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="nic"
                    value={formData.nic}
                    onChange={handleChange}
                    placeholder="Enter NIC number"
                    disabled={saving}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition"
                  />

                </div>


                {/* ADDRESS */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    rows="4"
                    disabled={saving}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition resize-none"
                  />

                </div>

              </div>

            </div>


            {/* CONTACT DETAILS */}

            <div className="border-t border-slate-800 pt-8 mb-8">

              <div className="mb-5">

                <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider">
                  Contact Information
                </p>

                <h3 className="text-xl font-bold mt-1">
                  Emergency Contacts
                </h3>

              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* MINER PHONE */}

                <div>

                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    📱 Miner Phone Number
                  </label>

                  <input
                    type="tel"
                    name="minerPhone"
                    value={formData.minerPhone}
                    onChange={handleChange}
                    placeholder="Enter miner phone"
                    disabled={saving}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition"
                  />

                </div>


                {/* EMERGENCY PHONE */}

                <div>

                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    🚨 Emergency / GDR Contact
                  </label>

                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    placeholder="Emergency contact number"
                    disabled={saving}
                    className="w-full bg-slate-800 border border-red-500/30 focus:border-red-500 rounded-xl px-4 py-3 text-white outline-none transition"
                  />

                </div>

              </div>

            </div>


            {/* INFO */}

            <div className="border-t border-slate-800 pt-6 mb-6">

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">

                <p className="text-sm font-semibold">
                  ℹ️ Automatic Safety Data
                </p>

                <p className="text-xs text-slate-400 mt-2 leading-5">
                  Heart rate, SpO₂, temperature, pressure,
                  gas readings, motion status, SOS status and
                  GPS location are automatically received from
                  the Smart Safety Jacket.
                </p>

              </div>

            </div>


            {/* BUTTONS */}

            <div className="border-t border-slate-800 pt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">

              <button
                type="button"
                onClick={() => navigate(`/miner/${id}`)}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={saving}
                className="px-7 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >

                {saving ? (
                  <>
                    <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    💾 Save Changes
                  </>
                )}

              </button>

            </div>

          </form>

        </div>


        {/* FOOTER NOTE */}

        <div className="mt-5 bg-slate-900 border border-slate-800 rounded-xl p-4">

          <p className="text-xs text-slate-500 leading-5">
            Miner ID is used to connect the wearable jacket
            sensor data with the correct miner. Sensor readings
            and GPS information are updated automatically.
          </p>

        </div>

      </div>

    </div>
  );
}

export default EditMiner;