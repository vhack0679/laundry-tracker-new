import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
}
 from 'firebase/firestore';
import {
  AlertCircle,
  Plus,
  Trash,
  CheckCircle,
  Shirt,
  WashingMachine,
  ArrowDownWideNarrow,
  CalendarDays,
  Tag,
  List,
  Grid,
  Settings,
  Key,
  Database,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Camera, // Added Camera icon
  UploadCloud, // Added UploadCloud icon
  Link, // Added Link icon
  Palette, // Added Palette icon for customization
} from 'lucide-react';

// --- Firebase and Environment Configuration ---
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const apiKey = ""; 

// Initialize Firebase app.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Utility Functions ---

/**
 * Calculates the time difference in a human-readable format (e.g., "3 days ago").
 * @param {Date} date - The last washed date object.
 * @returns {string} The time since the last wash.
 */
const getTimeSince = (date) => {
  if (!date) return 'Never';
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return '1 day ago';
  return `${diffInDays} days ago`;
};

// --- Firestore Path Helper ---
const getItemCollectionPath = (authUid, sharedKey) => {
  if (sharedKey && sharedKey !== authUid) {
    return `artifacts/${appId}/public/data/laundry_sharing/${sharedKey}/items`;
  }
  return `artifacts/${appId}/users/${authUid}/laundry_items`;
};

const getCategoryCollectionPath = (authUid, sharedKey) => {
  if (sharedKey && sharedKey !== authUid) {
    return `artifacts/${appId}/public/data/laundry_sharing/${sharedKey}/categories`;
  }
  return `artifacts/${appId}/users/${authUid}/laundry_categories`;
};

// --- React Components (Inline) ---

// Component for the laundry item in list view.
const LaundryItem = ({ item, onWear, onWash, onDelete }) => {
  const needsWashing = item.usageCount >= 3;
  const lastWashedDate = item.lastWashed?.toDate();
  const timeSinceWashed = getTimeSince(lastWashedDate);

  // Set default placeholder for image error or absence
  const getImageUrl = (item) => {
    if (item.imageUrl && item.imageUrl.trim() !== '' && !item.imageUrl.includes('Image+Too+Large')) return item.imageUrl;
    return `https://placehold.co/150x150/e2e8f0/1a202c?text=${(item.name || 'Item').substring(0, 3)}`;
  };

  return (
    <div className={`p-4 rounded-xl flex items-center justify-between transition-all duration-300 ${needsWashing ? 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'} shadow-sm border`}>
      <div className="flex-1 flex items-center space-x-3 sm:space-x-4">
        {item.imageUrl && item.imageUrl.trim() !== '' && !item.imageUrl.includes('Image+Too+Large') ? (
          <img 
            src={getImageUrl(item)} 
            alt={item.name} 
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover bg-slate-100 dark:bg-slate-700 p-1"
            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/150x150/e2e8f0/1a202c?text=${(item.name || 'I').substring(0, 3)}` }}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className={`p-2 rounded-full ${needsWashing ? 'bg-red-200 text-red-800' : 'bg-blue-100 text-blue-600'}`}>
            <Shirt size={18} className="sm:size-20" />
          </div>
        )}
        <div className="flex-1 space-y-0.5 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">{item.name}</h3>
          <div className="flex flex-wrap items-center gap-x-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Worn: {item.usageCount} times</span>
            <span className="h-1 w-1 rounded-full bg-slate-400 dark:bg-slate-600 hidden sm:inline"></span>
            <div className="px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center">
              <Tag size={12} className="inline mr-0.5" /> {item.category || 'Uncategorized'}
            </div>
            <div className="flex items-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 w-full sm:w-auto mt-0.5 sm:mt-0">
              <CalendarDays size={14} className="mr-1" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Last Washed: {timeSinceWashed}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Action buttons: Stack vertically on mobile */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 ml-2 flex-shrink-0">
        <button
          onClick={() => onWear(item)}
          className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors duration-200 transform hover:scale-105 shadow-md"
          aria-label={`Mark ${item.name} as worn`}
        >
          <Plus size={18} />
        </button>
        <button
          onClick={() => onWash(item)}
          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 transform hover:scale-105 shadow-md"
          aria-label={`Mark ${item.name} as washed`}
        >
          <WashingMachine size={18} /> {/* Changed to WashingMachine icon for clarity */}
        </button>
        <button
          onClick={() => onDelete(item)}
          className="p-2 bg-slate-300 text-slate-700 rounded-full hover:bg-slate-400 transition-colors duration-200 transform hover:scale-105 shadow-md"
          aria-label={`Delete ${item.name}`}
        >
          <Trash size={18} />
        </button>
      </div>
    </div>
  );
};

// Component for the laundry item in grid (wardrobe) view.
const WardrobeItem = ({ item, onWear, onWash, onDelete }) => {
  const needsWashing = item.usageCount >= 3;
  const lastWashedDate = item.lastWashed?.toDate();
  const timeSinceWashed = getTimeSince(lastWashedDate);

  const imageUrl = item.imageUrl && item.imageUrl.trim() !== '' 
    ? item.imageUrl 
    : `https://placehold.co/150x150/e2e8f0/1a202c?text=${(item.name || 'I').substring(0, 3)}`;

  return (
    <div className={`p-3 rounded-xl flex flex-col items-center text-center transition-all duration-300 ${needsWashing ? 'bg-red-50 dark:bg-red-900 border-red-300 dark:border-red-700 shadow-lg ring-2 ring-red-500/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-md'} border`}>
      <div className="relative">
          <img 
            src={imageUrl} 
            alt={item.name} 
            // Styling to mimic a 'cutout' view: white background, object-contain
            className="h-28 w-28 sm:h-32 sm:w-32 rounded-xl object-contain bg-white dark:bg-slate-700 p-1 border-2 border-slate-200 dark:border-slate-700" 
            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/150x150/e2e8f0/1a202c?text=${(item.name || 'I').substring(0, 3)}` }}
            style={{ objectFit: 'contain' }}
          />
          {needsWashing && (
            <div className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full translate-x-1 -translate-y-1 shadow-lg" title="Needs Washing!">
                <AlertCircle size={14} />
            </div>
          )}
      </div>
      
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-2 truncate w-full px-1">{item.name}</h3>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
          <p className="font-medium">Worn: {item.usageCount}</p>
          <p className="italic">Washed: {timeSinceWashed}</p>
      </div>

      <div className="flex space-x-2 mt-3">
        <button
          onClick={() => onWear(item)}
          className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors duration-200 shadow-md"
          aria-label={`Mark ${item.name} as worn`}
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => onWash(item)}
          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 shadow-md"
          aria-label={`Mark ${item.name} as washed`}
        >
          <WashingMachine size={16} />
        </button>
        <button
          onClick={() => onDelete(item)}
          className="p-2 bg-slate-300 text-slate-700 rounded-full hover:bg-slate-400 transition-colors duration-200 shadow-md"
          aria-label={`Delete ${item.name}`}
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
};

// New Component for horizontal scrolling category row
const CategoryRow = ({ category, items, onWear, onWash, onDelete }) => {
    if (items.length === 0) return null;

    return (
        <div className="space-y-3 pb-6">
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <Tag size={20} className="mr-2 text-indigo-500" />
                {category} ({items.length})
            </h4>
            <div className="flex overflow-x-auto space-x-4 pb-2 -mx-4 px-4 sm:px-0">
                {items.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-44 sm:w-48">
                        <WardrobeItem 
                            item={item} 
                            onWear={onWear} 
                            onWash={onWash} 
                            onDelete={onDelete} 
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};


// Confirmation modal component.
const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 w-full max-w-sm border border-slate-300 dark:border-slate-700">
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
        <AlertCircle size={24} className="text-red-500 mr-2" /> Confirm Action
      </h3>
      <p className="text-slate-600 dark:text-slate-400">{message}</p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="p-3 rounded-xl bg-slate-300 text-slate-800 font-semibold hover:bg-slate-400 transition-colors shadow-md"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="p-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors shadow-md"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// Main App component.
const App = () => {
  const [laundryItems, setLaundryItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Shirts');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState([]);
  const [sortBy, setSortBy] = useState('usage');
  const [authUid, setAuthUid] = useState(null);
  const [dataKey, setDataKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWardrobeView, setIsWardrobeView] = useState(true);
  const [showWashModal, setShowWashModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newWashDate, setNewWashDate] = useState('');
  const [sharedKeyInput, setSharedKeyInput] = useState('');

  // --- Customization States (New) ---
  const [appName, setAppName] = useState('Laundry Tracker');
  const [appCaption, setAppCaption] = useState('Track clothes usage to know when to wash them.');
  // Default to Tailwind slate-100 (light mode background)
  const [primaryBgColor, setPrimaryBgColor] = useState('#f1f5f9'); 
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  
  const availableFonts = [
    { name: 'Inter (Default)', style: 'Inter, sans-serif' },
    { name: 'Roboto', style: 'Roboto, sans-serif' },
    { name: 'Open Sans', style: 'Open Sans, sans-serif' },
    { name: 'Montserrat', style: 'Montserrat, sans-serif' },
    { name: 'Courier New', style: 'Courier New, monospace' },
  ];
  
  // --- New: Function to save customization to localStorage ---
  const saveCustomization = (newSettings) => {
    const currentSettings = { appName, appCaption, primaryBgColor, fontFamily };
    const mergedSettings = { ...currentSettings, ...newSettings };
    localStorage.setItem('appCustomization', JSON.stringify(mergedSettings));
    
    // Update states immediately for visual refresh
    if (newSettings.appName !== undefined) setAppName(newSettings.appName);
    if (newSettings.appCaption !== undefined) setAppCaption(newSettings.appCaption);
    if (newSettings.primaryBgColor !== undefined) setPrimaryBgColor(newSettings.primaryBgColor);
    if (newSettings.fontFamily !== undefined) setFontFamily(newSettings.fontFamily);
  };

  // --- New State for Category Filtering & Ordering ---
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [displayCategoryOrder, setDisplayCategoryOrder] = useState([]);
  
  const defaultCategories = ['Shirts', 'Pants', 'Nightwear', 'Innerwear', 'Towels', 'Bedsheets', 'Handkerchiefs'];
  // The full list of all possible categories (including default and custom)
  const allCategories = [...defaultCategories, ...customCategories].filter((v, i, a) => a.indexOf(v) === i);

  // --- Image Upload Handler (Restored) ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Check file size (1MB limit for Base64 storage in Firestore document)
        if (reader.result.length > 1024 * 1024) { 
          // Use a special URL to indicate file is too large
          setItemImageUrl(`https://placehold.co/150x50/ff0000/ffffff?text=Image+Too+Large`);
          console.error("Image too large. Max 1MB allowed for inline storage.");
          return;
        }
        setItemImageUrl(reader.result); // Set Base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  // Load shared key and customization from localStorage on initial load
  useEffect(() => {
    const storedKey = localStorage.getItem('sharedDataKey');
    if (storedKey) {
      setSharedKeyInput(storedKey);
    }
    
    const storedCustomization = localStorage.getItem('appCustomization');
    if (storedCustomization) {
      try {
        const custom = JSON.parse(storedCustomization);
        setAppName(custom.appName || 'Laundry Tracker');
        setAppCaption(custom.appCaption || 'Track clothes usage to know when to wash them.');
        setPrimaryBgColor(custom.primaryBgColor || '#f1f5f9');
        setFontFamily(custom.fontFamily || 'Inter, sans-serif');
      } catch (e) {
        console.error("Error parsing app customization from localStorage", e);
      }
    }
  }, []);
  
  // Initialize and persist Category Order (local storage for simplicity, as per previous instructions)
  useEffect(() => {
    const storedOrder = JSON.parse(localStorage.getItem('categoryDisplayOrder'));
    
    // Combine all available categories (including 'Uncategorized')
    const currentCategories = ['Uncategorized', ...allCategories];
    
    if (storedOrder && storedOrder.length > 0) {
        // Merge stored order with any newly added categories
        const mergedOrder = [
            ...storedOrder.filter(cat => currentCategories.includes(cat.name)),
            ...currentCategories.filter(cat => !storedOrder.map(o => o.name).includes(cat))
                                 .map(cat => ({ name: cat, visible: true }))
        ];
        setDisplayCategoryOrder(mergedOrder);
    } else if (allCategories.length > 0 && displayCategoryOrder.length === 0) {
        // Initialize if no order is stored yet
        const initialOrder = currentCategories.map(cat => ({ name: cat, visible: true }));
        setDisplayCategoryOrder(initialOrder);
        localStorage.setItem('categoryDisplayOrder', JSON.stringify(initialOrder));
    }
  }, [allCategories.length, customCategories.length]);


  // Effect for Firebase authentication
  useEffect(() => {
    const authenticate = async (user) => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error('Firebase authentication failed:', error);
      }
    };

    // Listen for auth state changes.
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUid(user.uid);
        // Set the data key: prioritize stored shared key, otherwise use the UID
        setDataKey(localStorage.getItem('sharedDataKey') || user.uid);
        setSharedKeyInput(localStorage.getItem('sharedDataKey') || user.uid);
      } else {
        authenticate();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Effect for Firestore data subscription
  useEffect(() => {
    if (!authUid || !dataKey) {
      return;
    }

    setLoading(true);

    const itemsPath = getItemCollectionPath(authUid, dataKey);
    const categoriesPath = getCategoryCollectionPath(authUid, dataKey);
    
    // 1. Items Listener
    const itemsRef = collection(db, itemsPath);
    const qItems = query(itemsRef);
    
    const unsubscribeFirestoreItems = onSnapshot(qItems, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLaundryItems(items);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching items data:', error);
      setLoading(false);
    });

    // 2. Categories Listener
    const categoriesRef = collection(db, categoriesPath);
    const qCategories = query(categoriesRef);

    const unsubscribeFirestoreCategories = onSnapshot(qCategories, (snapshot) => {
      const categories = snapshot.docs.map(doc => doc.data().name);
      setCustomCategories(categories);
      if (selectedCategory && !allCategories.includes(selectedCategory)) {
        setSelectedCategory('Shirts');
      }
    }, (error) => {
      console.error('Error fetching categories:', error);
    });

    return () => {
      unsubscribeFirestoreItems();
      unsubscribeFirestoreCategories();
    };

  }, [authUid, dataKey]);


  // Handler for setting the shared key
  const setSharedKey = (e) => {
    e.preventDefault();
    const key = sharedKeyInput.trim();
    if (key.length < 4) {
      console.error("Shared key must be at least 4 characters.");
      return;
    }
    
    localStorage.setItem('sharedDataKey', key);
    setDataKey(key);
    setShowSettingsModal(false);
  };

  // Handler for clearing the shared key
  const clearSharedKey = () => {
    localStorage.removeItem('sharedDataKey');
    setDataKey(authUid);
    setSharedKeyInput(authUid); 
    setShowSettingsModal(false);
  };

  // Sort the laundry items whenever the list or sort criteria changes.
  const sortedItems = [...laundryItems].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = a.lastWashed?.toDate() || new Date(0);
      const dateB = b.lastWashed?.toDate() || new Date(0);
      return dateB - dateA;
    }
    if (sortBy === 'usage') {
      return b.usageCount - a.usageCount;
    }
    return (a.name || '').localeCompare(b.name || '');
  });
  
  // Filter the items based on the selected category
  const filteredItems = selectedCategoryFilter === 'All'
    ? sortedItems
    : sortedItems.filter(item => item.category === selectedCategoryFilter);


  // Add a new laundry item to Firestore.
  const addItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !authUid || !dataKey) return;
    
    const finalImageUrl = itemImageUrl.trim() || `https://placehold.co/150x150/e2e8f0/1a202c?text=${itemName.substring(0, 3)}`;

    try {
      const itemsPath = getItemCollectionPath(authUid, dataKey);
      const itemsRef = collection(db, itemsPath);
      await addDoc(itemsRef, {
        name: itemName.trim(),
        usageCount: 0,
        category: selectedCategory,
        imageUrl: finalImageUrl,
        lastWashed: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      setItemName('');
      setItemImageUrl('');
    } catch (error) {
      console.error('Error adding document:', error);
    }
  };

  // Add a new category to Firestore.
  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !authUid || !dataKey) return;
    try {
      const categoriesPath = getCategoryCollectionPath(authUid, dataKey);
      const categoriesRef = collection(db, categoriesPath);
      await addDoc(categoriesRef, { name: newCategoryName.trim() });
      setNewCategoryName('');
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  // Increment usage count for an item.
  const wearItem = async (item) => {
    if (!authUid || !dataKey) return;
    try {
      const itemsPath = getItemCollectionPath(authUid, dataKey);
      const itemRef = doc(db, itemsPath, item.id);
      await updateDoc(itemRef, {
        usageCount: (item.usageCount || 0) + 1,
      });
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  // Open the wash modal.
  const openWashModal = (item) => {
    setSelectedItem(item);
    const lastWashedDate = item.lastWashed?.toDate() 
      ? item.lastWashed.toDate().toISOString().substring(0, 10) 
      : new Date().toISOString().substring(0, 10);
    setNewWashDate(lastWashedDate); 
    setShowWashModal(true);
  };

  // Reset usage count and update last washed date.
  const washItem = async () => {
    if (!authUid || !dataKey || !selectedItem || !newWashDate) return;
    try {
      const itemsPath = getItemCollectionPath(authUid, dataKey);
      const itemRef = doc(db, itemsPath, selectedItem.id);
      await updateDoc(itemRef, {
        usageCount: 0,
        lastWashed: Timestamp.fromDate(new Date(newWashDate)), 
      });
      setShowWashModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  // Open the delete confirmation modal.
  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  // Delete an item from Firestore.
  const deleteItem = async () => {
    if (!authUid || !dataKey || !selectedItem) return;
    try {
      const itemsPath = getItemCollectionPath(authUid, dataKey);
      const itemRef = doc(db, itemsPath, selectedItem.id);
      await deleteDoc(itemRef);
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };
  
  // --- Category Order Management Logic ---
  const saveCategoryOrder = (newOrder) => {
      setDisplayCategoryOrder(newOrder);
      localStorage.setItem('categoryDisplayOrder', JSON.stringify(newOrder));
  };
  
  const moveCategory = (index, direction) => {
      const newOrder = [...displayCategoryOrder];
      const newIndex = direction === 'up' ? index - 1 : index + 1;

      if (newIndex >= 0 && newIndex < newOrder.length) {
          [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
          saveCategoryOrder(newOrder);
      }
  };

  const toggleCategoryVisibility = (index) => {
      const newOrder = [...displayCategoryOrder];
      newOrder[index].visible = !newOrder[index].visible;
      saveCategoryOrder(newOrder);
  };

  // --- Category Breakdown View Rendering ---
  
  // Group all items by category
  const itemsByCategory = sortedItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
        acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // Determine the order and visibility of categories to display
  const categoriesToDisplay = displayCategoryOrder
    .filter(order => order.visible && (itemsByCategory[order.name] || []).length > 0);

  // --- Application Render ---
  return (
    <div 
      className="min-h-screen text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-6 flex flex-col items-center transition-colors duration-500"
      style={{ backgroundColor: primaryBgColor, fontFamily: fontFamily }}
    >
      <div className="w-full max-w-2xl bg-slate-200 dark:bg-slate-800 p-4 sm:p-6 rounded-3xl shadow-2xl space-y-6 sm:space-y-8 border-slate-300 dark:border-slate-700 border">
        
        {/* Header */}
        <header className="text-center space-y-1 sm:space-y-2">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-800 dark:text-slate-100">
            {appName}
          </h1>
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400">
            {appCaption}
          </p>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <p className="flex items-center justify-center space-x-2">
              <Database size={16} />
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                Data Key:
              </span>
              <span className={`font-mono text-xs p-1 rounded-md ${dataKey && dataKey !== authUid ? 'bg-indigo-500 text-white' : 'bg-slate-300 dark:bg-slate-700'} break-all`}>
                {dataKey || 'Loading...'}
              </span>
            </p>
          </div>
        </header>
        
        {/* View Toggle and Settings */}
        <div className="flex justify-between space-x-2">
           <div className="flex space-x-2">
             <button
              onClick={() => setShowSettingsModal(true)}
              className="p-3 rounded-full bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-300 transition-colors duration-200 hover:bg-slate-400 dark:hover:bg-slate-600 shadow-md"
              aria-label="Manage categories and shared key"
            >
              <Settings size={20} />
            </button>
           </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setIsWardrobeView(false)}
              className={`p-3 rounded-full transition-colors duration-200 shadow-md ${!isWardrobeView ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-400 dark:hover:bg-slate-600'}`}
              aria-label="Switch to list view"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setIsWardrobeView(true)}
              className={`p-3 rounded-full transition-colors duration-200 shadow-md ${isWardrobeView ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-400 dark:hover:bg-slate-600'}`}
              aria-label="Switch to wardrobe view"
            >
              <Grid size={20} />
            </button>
          </div>
        </div>
        
        {/* --- Category Filter Bar (New Feature) --- */}
        <div className="flex overflow-x-auto space-x-3 pb-2 pt-1 border-b border-slate-300 dark:border-slate-700 -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* 'All' button */}
          <button
            onClick={() => setSelectedCategoryFilter('All')}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold transition-colors duration-200 shadow-md text-sm ${selectedCategoryFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-400 dark:hover:bg-slate-600'}`}
          >
            All Items ({laundryItems.length})
          </button>
          
          {/* Category buttons */}
          {allCategories.map(cat => {
            const categoryName = cat || 'Uncategorized';
            const count = sortedItems.filter(item => (item.category || 'Uncategorized') === categoryName).length;
            if (count === 0) return null; // Hide categories with no items
            return (
              <button
                key={categoryName}
                onClick={() => setSelectedCategoryFilter(categoryName)}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold transition-colors duration-200 shadow-md text-sm ${selectedCategoryFilter === categoryName ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-400 dark:hover:bg-slate-600'}`}
              >
                {categoryName} ({count})
              </button>
            );
          })}
        </div>
        {/* --- End Category Filter Bar --- */}


        {/* Dynamic Controls / Add Item Form */}
        {!isWardrobeView ? (
          /* Sorting options in List View */
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-300 dark:bg-slate-700 shadow-inner">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-300 font-semibold">
              <ArrowDownWideNarrow size={18} />
              <span>Sort by:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="usage">Usage Count (Needs Wash)</option>
              <option value="date">Last Washed (Newest)</option>
            </select>
          </div>
        ) : (
          /* Add Item Form in Wardrobe View */
          <form onSubmit={addItem} className="flex flex-col space-y-4 p-4 bg-white dark:bg-slate-700 rounded-xl shadow-inner border border-slate-300 dark:border-slate-600">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Add New Item to Wardrobe</h4>
            
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Item Name (e.g., Blue T-shirt)"
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            />
            
            {/* --- Image Upload Section --- */}
            <div className='space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-400 dark:border-slate-600'>
              <div className='flex justify-between items-center'>
                <p className='text-sm font-medium text-slate-700 dark:text-slate-300'>Image Source (Max 1MB)</p>
                {itemImageUrl && (
                  <button type="button" onClick={() => setItemImageUrl('')} className="text-xs text-red-500 hover:text-red-700 flex items-center">
                    <X size={14} className="mr-1" /> Remove
                  </button>
                )}
              </div>
              
              <div className='grid grid-cols-3 gap-3'>
                {/* Camera Button */}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="camera"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <div className="p-3 rounded-xl text-center bg-indigo-200 text-indigo-800 hover:bg-indigo-300 transition-colors flex flex-col items-center justify-center shadow-sm">
                    <Camera size={20} />
                    <span className="text-xs mt-1 font-semibold">Take Photo</span>
                  </div>
                </label>
                
                {/* File Upload Button */}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <div className="p-3 rounded-xl text-center bg-green-200 text-green-800 hover:bg-green-300 transition-colors flex flex-col items-center justify-center shadow-sm">
                    <UploadCloud size={20} />
                    <span className="text-xs mt-1 font-semibold">Upload File</span>
                  </div>
                </label>

                {/* URL Input */}
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-700 p-2 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm">
                    <Link size={20} className="text-slate-500 flex-shrink-0" />
                    <input
                      type="text"
                      value={itemImageUrl}
                      onChange={(e) => setItemImageUrl(e.target.value)}
                      placeholder="Paste URL"
                      className="w-full bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none text-sm"
                    />
                </div>
              </div>

              {itemImageUrl && itemImageUrl.trim() !== '' && !itemImageUrl.includes('Image+Too+Large') && (
                  <div className="mt-4 flex flex-col items-center space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Image Preview (For best 'cutout' results, use a transparent PNG.)</p>
                    <div className="h-40 w-40 p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center shadow-inner">
                        <img 
                            src={itemImageUrl} 
                            alt="Item Preview" 
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/150x150/ff0000/ffffff?text=Error`; }}
                        />
                    </div>
                  </div>
              )}
               {itemImageUrl.includes('Image+Too+Large') && (
                   <p className="text-center text-red-500 text-sm font-medium">Image file is too large ( {'>'} 1MB). Please try a smaller file or a direct URL.</p>
               )}
            </div>
            {/* --- End Image Upload Section --- */}

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!itemName.trim()}
              className={`flex items-center justify-center p-3 rounded-xl font-semibold shadow-lg transition-colors duration-200 ${itemName.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700 transform hover:scale-[1.01]' : 'bg-slate-400 text-slate-100 cursor-not-allowed'}`}
              aria-label="Add new item"
            >
              <Plus size={20} className="mr-2" /> Add Item
            </button>
          </form>
        )}
        

        {/* Loading and Empty State */}
        {loading ? (
          <div className="text-center p-8 text-slate-500 dark:text-slate-400">
            <WashingMachine size={48} className="mx-auto animate-spin" />
            <p className="mt-4 text-lg">Loading your laundry list...</p>
          </div>
        ) : filteredItems.length === 0 && selectedCategoryFilter !== 'All' ? (
          <div className="text-center p-8 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-xl shadow-inner">
            <AlertCircle size={48} className="mx-auto text-yellow-500" />
            <p className="mt-4 text-lg font-bold">No items found!</p>
            <p className="mt-2 text-md">
                No items in the **{selectedCategoryFilter}** category.
              </p>
          </div>
        ) : (
          /* Main Item Display */
          <div className="space-y-4">
              {dataKey && dataKey !== authUid && (
                  <div className="p-3 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded-xl font-medium text-sm text-center shadow-md">
                    <Key size={16} className="inline mr-2" />
                    You are viewing the shared wardrobe key: <span className="font-bold">{dataKey}</span>.
                  </div>
              )}
              
              {/* Conditional rendering for Category Breakdown vs Filtered View */}
              {isWardrobeView && selectedCategoryFilter === 'All' ? (
                  // Category Breakdown View
                  <div className="space-y-6">
                      {categoriesToDisplay.map(categoryData => (
                          <CategoryRow
                              key={categoryData.name}
                              category={categoryData.name}
                              items={itemsByCategory[categoryData.name]}
                              onWear={wearItem}
                              onWash={openWashModal}
                              onDelete={openDeleteModal}
                          />
                      ))}
                      {/* Empty state for the Breakdown View if no items exist */}
                      {categoriesToDisplay.length === 0 && (
                          <div className="text-center p-8 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-xl shadow-inner">
                            <AlertCircle size={48} className="mx-auto text-yellow-500" />
                            <p className="mt-4 text-lg font-bold">Your wardrobe is empty!</p>
                            <p className="mt-2 text-md">
                                Switch to Wardrobe View (Grid Icon) to start adding clothes.
                            </p>
                          </div>
                      )}
                  </div>
              ) : (
                  // Single List/Grid Filtered View
                  isWardrobeView ? (
                      // Wardrobe Grid View
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {filteredItems.map((item) => (
                          <WardrobeItem
                            key={item.id}
                            item={item}
                            onWear={wearItem}
                            onWash={openWashModal}
                            onDelete={openDeleteModal}
                          />
                        ))}
                      </div>
                    ) : (
                      // List View
                      <div className="space-y-4">
                        {filteredItems.map((item) => (
                          <LaundryItem
                            key={item.id}
                            item={item}
                            onWear={wearItem}
                            onWash={openWashModal}
                            onDelete={openDeleteModal}
                          />
                        ))}
                      </div>
                    )
              )}
          </div>
        )}
      </div>

      {/* Wash Date Modal */}
      {showWashModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 w-full max-w-sm border border-slate-300 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <WashingMachine size={24} className="text-green-500 mr-2" /> Mark as Washed
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Select the date you washed "<span className="font-semibold">{selectedItem.name}</span>".
            </p>
            <input
              type="date"
              value={newWashDate}
              onChange={(e) => setNewWashDate(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowWashModal(false); setSelectedItem(null); }}
                className="p-3 rounded-xl bg-slate-300 text-slate-800 font-semibold hover:bg-slate-400 transition-colors shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={washItem}
                className="p-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors shadow-md"
              >
                Confirm Wash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <ConfirmationModal
          message={`Are you sure you want to delete "${selectedItem.name}"? This action cannot be undone.`}
          onConfirm={deleteItem}
          onCancel={() => { setShowDeleteModal(false); setSelectedItem(null); }}
        />
      )}

      {/* Settings Modal (Categories, Shared Key, and Customization) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl space-y-6 w-full max-w-md my-4 border border-slate-300 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center flex-shrink-0">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h3>
                <button 
                    onClick={() => setShowSettingsModal(false)}
                    className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors bg-slate-200 dark:bg-slate-700 flex-shrink-0"
                >
                    <X size={24} />
                </button>
            </div>

            {/* --- Customization Section (New) --- */}
             <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-inner">
                <h4 className="flex items-center text-xl font-semibold text-pink-600 dark:text-pink-400">
                    <Palette size={20} className="mr-2" /> App Customization
                </h4>
                
                {/* App Name */}
                <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">App Name</span>
                    <input
                        type="text"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        onBlur={(e) => saveCustomization({ appName: e.target.value })}
                        placeholder="App Title"
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600"
                    />
                </label>
                
                {/* App Caption */}
                <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Caption / Slogan</span>
                    <input
                        type="text"
                        value={appCaption}
                        onChange={(e) => setAppCaption(e.target.value)}
                        onBlur={(e) => saveCustomization({ appCaption: e.target.value })}
                        placeholder="A short description"
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600"
                    />
                </label>
                
                {/* Background Color */}
                <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Primary Background Color</span>
                    <div className="flex space-x-2 items-center">
                        <input
                            type="color"
                            value={primaryBgColor}
                            onChange={(e) => setPrimaryBgColor(e.target.value)}
                            onBlur={(e) => saveCustomization({ primaryBgColor: e.target.value })}
                            className="h-10 w-10 p-0.5 rounded-full border-2 border-slate-400 cursor-pointer"
                        />
                        <span className="font-mono text-sm text-slate-800 dark:text-slate-200">{primaryBgColor}</span>
                    </div>
                </label>

                {/* Font Family */}
                <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Text Font Family</span>
                    <select
                        value={fontFamily}
                        onChange={(e) => {
                            setFontFamily(e.target.value);
                            saveCustomization({ fontFamily: e.target.value });
                        }}
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600"
                    >
                        {availableFonts.map(font => (
                            <option key={font.name} value={font.style} style={{ fontFamily: font.style }}>
                                {font.name}
                            </option>
                        ))}
                    </select>
                </label>

            </div>

            {/* Category Order Management Section */}
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-inner">
                <h4 className="flex items-center text-xl font-semibold text-slate-800 dark:text-slate-100">Reorder & Hide Categories</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Adjust the order of rows on the Wardrobe homepage.</p>
                <div className="space-y-2 max-h-48 overflow-y-auto border-t border-slate-300 dark:border-slate-600 pt-2">
                    {displayCategoryOrder.map((cat, index) => {
                        const count = sortedItems.filter(item => (item.category || 'Uncategorized') === cat.name).length;
                        
                        return (
                            <div key={cat.name} className={`flex items-center justify-between p-2 rounded-lg ${cat.visible ? 'bg-white dark:bg-slate-800' : 'bg-slate-200 dark:bg-slate-700 opacity-60'}`}>
                                <div className="flex-1 min-w-0 pr-2">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{cat.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{count} items</p>
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => toggleCategoryVisibility(index)}
                                        className={`p-2 rounded-full transition-colors ${cat.visible ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-slate-400 text-slate-700 hover:bg-slate-500'}`}
                                        title={cat.visible ? 'Hide from homepage' : 'Show on homepage'}
                                    >
                                        {cat.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button
                                        onClick={() => moveCategory(index, 'up')}
                                        disabled={index === 0}
                                        className={`p-2 rounded-full transition-colors ${index === 0 ? 'bg-slate-400 text-slate-700 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                                        title="Move Up"
                                    >
                                        <ArrowUp size={18} />
                                    </button>
                                    <button
                                        onClick={() => moveCategory(index, 'down')}
                                        disabled={index === displayCategoryOrder.length - 1}
                                        className={`p-2 rounded-full transition-colors ${index === displayCategoryOrder.length - 1 ? 'bg-slate-400 text-slate-700 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                                        title="Move Down"
                                    >
                                        <ArrowDown size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Shared Key Management Section (Rest of settings) */}
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-inner">
                <h4 className="flex items-center text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                    <Key size={20} className="mr-2" /> Shared Data Key
                </h4>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium p-2 bg-red-100 dark:bg-red-900 rounded-lg border border-red-300 dark:border-red-700">
                    ⚠️ Warning: Data stored under a shared key is public to anyone who knows it.
                </p>
                
                {dataKey && dataKey !== authUid ? (
                    <div className="space-y-3">
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            You are currently viewing data linked to: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 break-all">{dataKey}</span>.
                        </p>
                        <button
                            onClick={clearSharedKey}
                            className="w-full p-3 rounded-xl bg-slate-300 text-slate-800 font-semibold hover:bg-slate-400 transition-colors shadow-md"
                        >
                            Stop Sharing & Revert to Private Data
                        </button>
                    </div>
                ) : (
                    <form onSubmit={setSharedKey} className="space-y-3">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Enter a key to view or create a shared wardrobe.
                        </p>
                        <input
                            type="text"
                            value={sharedKeyInput}
                            onChange={(e) => setSharedKeyInput(e.target.value)}
                            placeholder="Enter unique shared key (min 4 chars)"
                            className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            disabled={sharedKeyInput.trim().length < 4}
                            className={`w-full p-3 rounded-xl font-semibold transition-colors shadow-md ${sharedKeyInput.trim().length >= 4 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-400 text-slate-100 cursor-not-allowed'}`}
                        >
                            Set Shared Key
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                            Your private anonymous ID is: <span className='font-mono break-all'>{authUid || '...'}</span>
                        </p>
                    </form>
                )}
            </div>

            {/* Category Management Section (Add new categories) */}
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-inner">
                <h4 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Add New Categories</h4>
                <form onSubmit={addCategory} className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New Category Name"
                    className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!newCategoryName.trim()}
                    className={`p-3 rounded-xl font-semibold transition-colors shadow-md ${newCategoryName.trim() ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-400 text-slate-100 cursor-not-allowed'}`}
                  >
                    <Plus size={20} />
                  </button>
                </form>
                <div className="text-sm text-slate-600 dark:text-slate-400 max-h-32 overflow-y-auto pt-2">
                    <p className="font-semibold mb-1">All Defined Categories:</p>
                    <div className="flex flex-wrap gap-2">
                        {allCategories.map(cat => (
                            <span key={cat} className="px-3 py-1 bg-slate-300 dark:bg-slate-600 rounded-full text-slate-800 dark:text-slate-200 text-xs font-medium shadow-sm">
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default App;
