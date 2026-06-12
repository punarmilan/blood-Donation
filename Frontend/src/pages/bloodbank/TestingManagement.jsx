import React, { useState, useEffect } from "react";
import { FlaskConical, Search, RefreshCw, AlertTriangle, CheckCircle, ShieldAlert, Check, X, FileText, ArrowRight, Activity } from "lucide-react";
import toast from "react-hot-toast";
import bloodBankService from "../../services/bloodBankService";

export default function TestingManagement() {
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [testForm, setTestForm] = useState({
    hivTest: "Pending",
    hepatitisBTest: "Pending",
    hepatitisCTest: "Pending",
    syphilisTest: "Pending",
    malariaTest: "Pending",
    aboRhVerification: "Pending",
    hemoglobinChecked: 13.5,
    testedBy: "",
    testRemarks: "",
  });

  const fetchTestingUnits = async () => {
    setLoading(true);
    try {
      // Fetch only units that are in "Testing Pending" currentStatus
      const res = await bloodBankService.getBloodUnits({ currentStatus: "Testing Pending" });
      if (res.success) {
        setUnits(res.units);
      }
    } catch (err) {
      toast.error("Failed to load laboratory queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestingUnits();
  }, []);

  const handleSelectUnit = (unit) => {
    setSelectedUnit(unit);
    setTestForm({
      hivTest: unit.hivTest || "Pending",
      hepatitisBTest: unit.hepatitisBTest || "Pending",
      hepatitisCTest: unit.hepatitisCTest || "Pending",
      syphilisTest: unit.syphilisTest || "Pending",
      malariaTest: unit.malariaTest || "Pending",
      aboRhVerification: unit.aboRhVerification || "Pending",
      hemoglobinChecked: unit.hemoglobinChecked || 13.5,
      testedBy: unit.testedBy || "",
      testRemarks: unit.testRemarks || "",
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTestForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveTests = async (e) => {
    e.preventDefault();
    if (!selectedUnit) return;
    setSaving(true);
    try {
      const res = await bloodBankService.updateTesting(selectedUnit._id, testForm);
      if (res.success) {
        toast.success("Test results saved successfully!");
        setSelectedUnit(res.unit);
        fetchTestingUnits();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save test results.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedUnit) return;
    if (!window.confirm("Are you sure you want to finalize this unit's test results? This will release it to Available stock or Discard it permanently if tests failed.")) return;
    setSaving(true);
    try {
      // Automatically save current inputs to database first so finalization verification has access to updated values
      const saveRes = await bloodBankService.updateTesting(selectedUnit._id, testForm);
      if (!saveRes.success) {
        toast.error("Failed to save draft results before finalizing.");
        setSaving(false);
        return;
      }
      
      const res = await bloodBankService.finalizeTesting(selectedUnit._id);
      if (res.success) {
        if (res.result === "Passed") {
          toast.success("Verification Passed! Blood Unit is now Available in Stock.");
        } else {
          toast.error("Verification Failed! Blood Unit Discarded due to non-conforming results.");
        }
        setSelectedUnit(null);
        fetchTestingUnits();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to finalize testing.");
    } finally {
      setSaving(false);
    }
  };

  const filteredUnits = units.filter(
    (u) =>
      u.unitId.toLowerCase().includes(search.toLowerCase()) ||
      u.bagNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <FlaskConical className="w-7 h-7 text-[#E24B4A]" />
            Laboratory Screening & Testing Portal
          </h1>
          <p className="text-sm text-zinc-500">Record donor infectious diseases screening, verify ABO Rh compatibility and finalize safety clearance</p>
        </div>

        <div className="p-4 bg-[#fff8eb] border border-[#ffe0b2] rounded-xl text-[#b78103] text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-[#f57c00]" />
          <div>
            <strong>Strict Medical Protocol Warning:</strong> This module records screening markers. Ensure physical lab assays are done according to national regulations before marking HIV, Syphilis, Hepatitis, or ABO Rh verification.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List Queue */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center gap-4">
              <span className="font-bold text-sm text-zinc-800">Screening Queue ({filteredUnits.length})</span>
              <button onClick={fetchTestingUnits} className="text-zinc-500 hover:text-zinc-900 transition">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-zinc-200">
              <div className="flex items-center border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs bg-zinc-50">
                <Search className="w-3.5 h-3.5 text-zinc-400 mr-2" />
                <input
                  type="text"
                  placeholder="Filter by Unit ID or Bag #..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none outline-none w-full"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-zinc-100">
              {loading ? (
                <div className="text-center py-12 text-zinc-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#E24B4A] mb-2" />
                  Loading queue...
                </div>
              ) : filteredUnits.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  No blood units currently awaiting testing.
                </div>
              ) : (
                filteredUnits.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => handleSelectUnit(u)}
                    className={`p-4 cursor-pointer hover:bg-zinc-50 transition ${
                      selectedUnit?._id === u._id ? "bg-red-50/40 border-l-4 border-l-[#E24B4A]" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-zinc-900">{u.unitId}</span>
                      <span className="text-[10px] text-zinc-500 font-semibold bg-zinc-100 border px-1.5 py-0.5 rounded">
                        Bag: {u.bagNumber}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>{u.component} ({u.bloodGroup})</span>
                      <span>Vol: {u.volumeML}ml</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Screening Form / Details */}
          <div className="lg:col-span-7">
            {selectedUnit ? (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-zinc-900">Lab Record for {selectedUnit.unitId}</h3>
                    <p className="text-xs text-zinc-500">ABO Group: <strong>{selectedUnit.bloodGroup}</strong> | Component: <strong>{selectedUnit.component}</strong></p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
                    Testing Pending
                  </span>
                </div>

                <form onSubmit={handleSaveTests} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* HIV */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-600">HIV 1 & 2 Screening *</label>
                      <select
                        name="hivTest"
                        value={testForm.hivTest}
                        onChange={handleFormChange}
                        className={`border rounded-lg p-2 text-sm focus:outline-none transition ${
                          testForm.hivTest === "Positive" ? "border-red-300 bg-red-50 text-red-700" :
                          testForm.hivTest === "Negative" ? "border-green-300 bg-green-50 text-green-700" : "border-zinc-200 bg-zinc-50"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Negative">Negative (Non-Reactive)</option>
                        <option value="Positive">Positive (Reactive)</option>
                      </select>
                    </div>

                    {/* HBV */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-600">Hepatitis B (HBsAg) *</label>
                      <select
                        name="hepatitisBTest"
                        value={testForm.hepatitisBTest}
                        onChange={handleFormChange}
                        className={`border rounded-lg p-2 text-sm focus:outline-none transition ${
                          testForm.hepatitisBTest === "Positive" ? "border-red-300 bg-red-50 text-red-700" :
                          testForm.hepatitisBTest === "Negative" ? "border-green-300 bg-green-50 text-green-700" : "border-zinc-200 bg-zinc-50"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Negative">Negative (Non-Reactive)</option>
                        <option value="Positive">Positive (Reactive)</option>
                      </select>
                    </div>

                    {/* HCV */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-600">Hepatitis C (Anti-HCV) *</label>
                      <select
                        name="hepatitisCTest"
                        value={testForm.hepatitisCTest}
                        onChange={handleFormChange}
                        className={`border rounded-lg p-2 text-sm focus:outline-none transition ${
                          testForm.hepatitisCTest === "Positive" ? "border-red-300 bg-red-50 text-red-700" :
                          testForm.hepatitisCTest === "Negative" ? "border-green-300 bg-green-50 text-green-700" : "border-zinc-200 bg-zinc-50"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Negative">Negative (Non-Reactive)</option>
                        <option value="Positive">Positive (Reactive)</option>
                      </select>
                    </div>

                    {/* Syphilis */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-600">Syphilis (VDRL/RPR) *</label>
                      <select
                        name="syphilisTest"
                        value={testForm.syphilisTest}
                        onChange={handleFormChange}
                        className={`border rounded-lg p-2 text-sm focus:outline-none transition ${
                          testForm.syphilisTest === "Positive" ? "border-red-300 bg-red-50 text-red-700" :
                          testForm.syphilisTest === "Negative" ? "border-green-300 bg-green-50 text-green-700" : "border-zinc-200 bg-zinc-50"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Negative">Negative (Non-Reactive)</option>
                        <option value="Positive">Positive (Reactive)</option>
                      </select>
                    </div>

                    {/* Malaria */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-600">Malaria Assay *</label>
                      <select
                        name="malariaTest"
                        value={testForm.malariaTest}
                        onChange={handleFormChange}
                        className={`border rounded-lg p-2 text-sm focus:outline-none transition ${
                          testForm.malariaTest === "Positive" ? "border-red-300 bg-red-50 text-red-700" :
                          testForm.malariaTest === "Negative" ? "border-green-300 bg-green-50 text-green-700" : "border-zinc-200 bg-zinc-50"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Negative">Negative (Non-Reactive)</option>
                        <option value="Positive">Positive (Reactive)</option>
                      </select>
                    </div>

                    {/* ABO Rh Verification */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-600">ABO & Rh Verification *</label>
                      <select
                        name="aboRhVerification"
                        value={testForm.aboRhVerification}
                        onChange={handleFormChange}
                        className={`border rounded-lg p-2 text-sm focus:outline-none transition ${
                          testForm.aboRhVerification === "Verified" ? "border-green-300 bg-green-50 text-green-700" :
                          testForm.aboRhVerification === "Mismatch" ? "border-red-300 bg-red-50 text-red-700" : "border-zinc-200 bg-zinc-50"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Verified">Verified Compatibility</option>
                        <option value="Mismatch">Mismatch Detected</option>
                      </select>
                    </div>

                    {/* Hemoglobin */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-600">Hemoglobin Level (g/dL) *</label>
                      <input
                        type="number"
                        step="0.1"
                        name="hemoglobinChecked"
                        value={testForm.hemoglobinChecked}
                        onChange={handleFormChange}
                        className="border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                        min="1"
                        required
                      />
                    </div>

                    {/* Tested By */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-600">Laboratory Technician / Officer *</label>
                      <input
                        type="text"
                        name="testedBy"
                        value={testForm.testedBy}
                        onChange={handleFormChange}
                        className="border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                        placeholder="Name or Officer ID"
                        required
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-600">Remarks / Lab notes</label>
                    <textarea
                      name="testRemarks"
                      value={testForm.testRemarks}
                      onChange={handleFormChange}
                      rows="3"
                      className="border border-zinc-200 rounded-lg p-2.5 text-sm focus:border-[#E24B4A] focus:outline-none transition"
                      placeholder="Enter any non-conforming parameters or observations..."
                    ></textarea>
                  </div>

                  {/* Submit / Action Buttons */}
                  <div className="flex items-center justify-between border-t pt-5 mt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold hover:bg-zinc-50 transition"
                    >
                      {saving ? "Saving..." : "Save Draft Results"}
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalize}
                      disabled={saving}
                      className="px-5 py-2.5 bg-[#E24B4A] text-white rounded-lg text-xs font-bold hover:bg-[#c93d3c] shadow-sm transition flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Finalize Verification
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-12 text-center text-zinc-500 h-[600px] flex flex-col justify-center items-center">
                <FlaskConical className="w-16 h-16 text-zinc-300 mb-4 animate-bounce" />
                <h3 className="font-bold text-zinc-800 text-lg mb-1">Select a Blood Unit</h3>
                <p className="text-xs text-zinc-400 max-w-sm">Select a collected blood unit from the left panel to update infectious disease screening assays and compatibility logs.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
