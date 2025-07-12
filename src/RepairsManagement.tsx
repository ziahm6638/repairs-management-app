import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";

export function RepairsManagement() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "repairs" | "properties" | "contractors">("dashboard");
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activeTab === "dashboard" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab("repairs")}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activeTab === "repairs" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
            }`}
          >
            🔧 Repair Requests
          </button>
          <button
            onClick={() => setActiveTab("properties")}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activeTab === "properties" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
            }`}
          >
            🏠 Properties
          </button>
          <button
            onClick={() => setActiveTab("contractors")}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activeTab === "contractors" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
            }`}
          >
            👷 Contractors
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "repairs" && <RepairsList />}
        {activeTab === "properties" && <PropertiesList />}
        {activeTab === "contractors" && <ContractorsList />}
      </div>
    </div>
  );
}

function Dashboard() {
  const repairs = useQuery(api.repairs.listRepairRequests, {});
  const properties = useQuery(api.properties.listProperties, {});

  if (!repairs || !properties) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const pendingRepairs = repairs.filter(r => r.status === "pending").length;
  const activeRepairs = repairs.filter(r => ["assigned", "in_progress"].includes(r.status)).length;
  const emergencyRepairs = repairs.filter(r => r.priority === "emergency" && r.status !== "completed").length;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{properties.length}</div>
          <div className="text-gray-600">Total Properties</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">{pendingRepairs}</div>
          <div className="text-gray-600">Pending Repairs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{activeRepairs}</div>
          <div className="text-gray-600">Active Repairs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-red-600">{emergencyRepairs}</div>
          <div className="text-gray-600">Emergency Repairs</div>
        </div>
      </div>

      {/* Recent Repairs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Repair Requests</h2>
        </div>
        <div className="p-6">
          {repairs.slice(0, 5).map((repair) => (
            <div key={repair._id} className="flex items-center justify-between py-3 border-b last:border-b-0">
              <div>
                <div className="font-medium">{repair.title}</div>
                <div className="text-sm text-gray-600">{repair.property?.address}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  repair.priority === "emergency" ? "bg-red-100 text-red-700" :
                  repair.priority === "high" ? "bg-orange-100 text-orange-700" :
                  repair.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {repair.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  repair.status === "pending" ? "bg-orange-100 text-orange-700" :
                  repair.status === "assigned" ? "bg-blue-100 text-blue-700" :
                  repair.status === "in_progress" ? "bg-purple-100 text-purple-700" :
                  repair.status === "completed" ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {repair.status.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RepairsList() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<Id<"repairRequests"> | null>(null);
  const repairs = useQuery(api.repairs.listRepairRequests, {});
  const properties = useQuery(api.properties.listProperties, {});

  if (!repairs || !properties) {
    return <div className="p-6">Loading repairs...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Repair Requests</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Repair Request
        </button>
      </div>

      {showCreateForm && (
        <CreateRepairForm
          properties={properties}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {selectedRepair && (
        <RepairDetails
          repairId={selectedRepair}
          onClose={() => setSelectedRepair(null)}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium">Title</th>
                <th className="text-left p-4 font-medium">Property</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-left p-4 font-medium">Priority</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Contractor</th>
                <th className="text-left p-4 font-medium">Created</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {repairs.map((repair) => (
                <tr key={repair._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium">{repair.title}</div>
                    <div className="text-sm text-gray-600 truncate max-w-xs">{repair.description}</div>
                  </td>
                  <td className="p-4">{repair.property?.address}</td>
                  <td className="p-4">
                    <span className="capitalize">{repair.category}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      repair.priority === "emergency" ? "bg-red-100 text-red-700" :
                      repair.priority === "high" ? "bg-orange-100 text-orange-700" :
                      repair.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {repair.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      repair.status === "pending" ? "bg-orange-100 text-orange-700" :
                      repair.status === "assigned" ? "bg-blue-100 text-blue-700" :
                      repair.status === "in_progress" ? "bg-purple-100 text-purple-700" :
                      repair.status === "completed" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {repair.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    {repair.contractor?.name || "Unassigned"}
                  </td>
                  <td className="p-4">
                    {new Date(repair._creationTime).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedRepair(repair._id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CreateRepairForm({ properties, onClose }: { properties: any[], onClose: () => void }) {
  const [formData, setFormData] = useState({
    propertyId: "",
    title: "",
    description: "",
    category: "other",
    priority: "medium",
    reportedBy: "landlord",
  });

  const createRepair = useMutation(api.repairs.createRepairRequest);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.propertyId || !formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createRepair({
        propertyId: formData.propertyId as Id<"properties">,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        reportedBy: formData.reportedBy,
      });
      
      toast.success("Repair request created successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to create repair request");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create Repair Request</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Property *</label>
            <select
              value={formData.propertyId}
              onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a property</option>
              {properties.map((property) => (
                <option key={property._id} value={property._id}>
                  {property.address}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Detailed description of the repair needed"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="hvac">HVAC</option>
              <option value="appliance">Appliance</option>
              <option value="structural">Structural</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reported By</label>
            <select
              value={formData.reportedBy}
              onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
              <option value="agent">Agent</option>
              <option value="inspection">Inspection</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RepairDetails({ repairId, onClose }: { repairId: Id<"repairRequests">, onClose: () => void }) {
  const repair = useQuery(api.repairs.getRepairDetails, { repairId });
  const contractors = useQuery(api.contractors.listContractors, { isActive: true });
  const updateStatus = useMutation(api.repairs.updateRepairStatus);
  const assignContractor = useMutation(api.repairs.assignContractor);

  const [showAssignForm, setShowAssignForm] = useState(false);

  if (!repair || !contractors) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">Loading...</div>
      </div>
    );
  }

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateStatus({
        repairId,
        status: newStatus,
      });
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Repair Request Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Title</label>
                <div className="font-medium">{repair.title}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Property</label>
                <div className="font-medium">{repair.property?.address}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Category</label>
                <div className="font-medium capitalize">{repair.category}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Priority</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  repair.priority === "emergency" ? "bg-red-100 text-red-700" :
                  repair.priority === "high" ? "bg-orange-100 text-orange-700" :
                  repair.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {repair.priority}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm text-gray-600">Description</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg">{repair.description}</div>
            </div>
          </div>

          {/* Status and Actions */}
          <div>
            <h3 className="font-semibold mb-3">Status & Actions</h3>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-600">Current Status</label>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    repair.status === "pending" ? "bg-orange-100 text-orange-700" :
                    repair.status === "assigned" ? "bg-blue-100 text-blue-700" :
                    repair.status === "in_progress" ? "bg-purple-100 text-purple-700" :
                    repair.status === "completed" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {repair.status.replace("_", " ")}
                  </span>
                </div>
              </div>
              {repair.contractor && (
                <div>
                  <label className="text-sm text-gray-600">Assigned Contractor</label>
                  <div className="font-medium">{repair.contractor.name}</div>
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {repair.status === "pending" && (
                <>
                  <button
                    onClick={() => setShowAssignForm(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Assign Contractor
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("in_progress")}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                  >
                    Start Work
                  </button>
                </>
              )}
              {repair.status === "assigned" && (
                <button
                  onClick={() => handleStatusUpdate("in_progress")}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                >
                  Start Work
                </button>
              )}
              {repair.status === "in_progress" && (
                <button
                  onClick={() => handleStatusUpdate("completed")}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Mark Complete
                </button>
              )}
              {repair.status !== "cancelled" && repair.status !== "completed" && (
                <button
                  onClick={() => handleStatusUpdate("cancelled")}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Updates History */}
          {repair.updates && repair.updates.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Update History</h3>
              <div className="space-y-3">
                {repair.updates.map((update) => (
                  <div key={update._id} className="border-l-4 border-blue-200 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{update.updateType.replace("_", " ")}</div>
                        {update.notes && <div className="text-sm text-gray-600">{update.notes}</div>}
                        {update.oldValue && update.newValue && (
                          <div className="text-sm text-gray-600">
                            Changed from "{update.oldValue}" to "{update.newValue}"
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(update._creationTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showAssignForm && (
          <AssignContractorForm
            repairId={repairId}
            contractors={contractors}
            onClose={() => setShowAssignForm(false)}
            onAssigned={() => {
              setShowAssignForm(false);
              toast.success("Contractor assigned successfully");
            }}
          />
        )}
      </div>
    </div>
  );
}

function AssignContractorForm({ 
  repairId, 
  contractors, 
  onClose, 
  onAssigned 
}: { 
  repairId: Id<"repairRequests">, 
  contractors: any[], 
  onClose: () => void,
  onAssigned: () => void
}) {
  const [formData, setFormData] = useState({
    contractorId: "",
    scheduledDate: "",
    estimatedCost: "",
    notes: "",
  });

  const assignContractor = useMutation(api.repairs.assignContractor);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contractorId) {
      toast.error("Please select a contractor");
      return;
    }

    try {
      await assignContractor({
        repairId,
        contractorId: formData.contractorId as Id<"contractors">,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).getTime() : undefined,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        notes: formData.notes || undefined,
      });
      
      onAssigned();
    } catch (error) {
      toast.error("Failed to assign contractor");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Assign Contractor</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contractor *</label>
            <select
              value={formData.contractorId}
              onChange={(e) => setFormData({ ...formData, contractorId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a contractor</option>
              {contractors.map((contractor) => (
                <option key={contractor._id} value={contractor._id}>
                  {contractor.name} - {contractor.specialties.join(", ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Scheduled Date</label>
            <input
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estimated Cost</label>
            <input
              type="number"
              step="0.01"
              value={formData.estimatedCost}
              onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Additional notes or instructions"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PropertiesList() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const properties = useQuery(api.properties.listProperties, {});

  if (!properties) {
    return <div className="p-6">Loading properties...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Properties</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Property
        </button>
      </div>

      {showCreateForm && (
        <CreatePropertyForm onClose={() => setShowCreateForm(false)} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div key={property._id} className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-lg mb-2">{property.address}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>Type: <span className="capitalize">{property.type}</span></div>
              {property.units && <div>Units: {property.units}</div>}
              <div className="flex justify-between pt-4 border-t">
                <div>
                  <div className="text-xs text-gray-500">Total Repairs</div>
                  <div className="font-semibold">{property.totalRepairs}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Pending</div>
                  <div className="font-semibold text-orange-600">{property.pendingRepairs}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Active</div>
                  <div className="font-semibold text-blue-600">{property.activeRepairs}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreatePropertyForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    address: "",
    type: "apartment",
    units: "",
  });

  const createProperty = useMutation(api.properties.createProperty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address) {
      toast.error("Please enter a property address");
      return;
    }

    try {
      await createProperty({
        address: formData.address,
        type: formData.type,
        units: formData.units ? parseInt(formData.units) : undefined,
      });
      
      toast.success("Property added successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to add property");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Property</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Address *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="123 Main St, City, State"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Property Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="commercial">Commercial</option>
              <option value="condo">Condo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Number of Units</label>
            <input
              type="number"
              value={formData.units}
              onChange={(e) => setFormData({ ...formData, units: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Leave blank for single unit"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContractorsList() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const contractors = useQuery(api.contractors.listContractors, {});

  if (!contractors) {
    return <div className="p-6">Loading contractors...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contractors</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Contractor
        </button>
      </div>

      {showCreateForm && (
        <CreateContractorForm onClose={() => setShowCreateForm(false)} />
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Contact</th>
                <th className="text-left p-4 font-medium">Specialties</th>
                <th className="text-left p-4 font-medium">Rate</th>
                <th className="text-left p-4 font-medium">Active Jobs</th>
                <th className="text-left p-4 font-medium">Completed</th>
                <th className="text-left p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((contractor) => (
                <tr key={contractor._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium">{contractor.name}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <div>{contractor.email}</div>
                      <div className="text-gray-600">{contractor.phone}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {contractor.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    {contractor.hourlyRate ? `$${contractor.hourlyRate}/hr` : "Not set"}
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-blue-600">{contractor.activeRepairs}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-green-600">{contractor.completedRepairs}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      contractor.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {contractor.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CreateContractorForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialties: [] as string[],
    hourlyRate: "",
  });

  const createContractor = useMutation(api.contractors.createContractor);

  const specialtyOptions = ["plumbing", "electrical", "hvac", "general", "appliance", "structural"];

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, specialties: [...formData.specialties, specialty] });
    } else {
      setFormData({ ...formData, specialties: formData.specialties.filter(s => s !== specialty) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || formData.specialties.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createContractor({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        specialties: formData.specialties,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
      });
      
      toast.success("Contractor added successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to add contractor");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Contractor</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Specialties *</label>
            <div className="space-y-2">
              {specialtyOptions.map((specialty) => (
                <label key={specialty} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes(specialty)}
                    onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
                    className="mr-2"
                  />
                  <span className="capitalize">{specialty}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hourly Rate</label>
            <input
              type="number"
              step="0.01"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Contractor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
