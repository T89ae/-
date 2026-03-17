const SalesDebtsPage = () => {
    // API base URL from environment variables
    const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api/sales`;

    const fetchSalesData = async () => {
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            // Handle your data here
        } catch (error) {
            console.error('Failed to fetch sales data:', error);
            // Optionally update the UI to inform the user
        }
    };

    // Call the fetch function when component mounts
    useEffect(() => {
        fetchSalesData();
    }, []);

    // ... (rest of your component code)

    return (
        <div>
            {/* ... Your existing component JSX ... */}
        </div>
    );
};

export default SalesDebtsPage;