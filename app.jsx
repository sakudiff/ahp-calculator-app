import React, { useState, useEffect, useCallback } from 'react';

// Random Index (RI) values for Consistency Ratio calculation (Saaty, 1980)
// RI values for n=1 to n=10. RI for n=1 and n=2 is 0.
// Moved outside the component to ensure it's constant and doesn't trigger re-renders of useCallback functions.
const RI = [0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];

// Main App component for the AHP Calculator
const App = () => {
    // State variables for the application
    const [criteria, setCriteria] = useState([]); // Array of criteria names
    const [alternatives, setAlternatives] = useState([]); // Array of alternative names
    const [criteriaComparisons, setCriteriaComparisons] = useState([]); // 2D array for criteria pairwise comparisons
    const [alternativeComparisons, setAlternativeComparisons] = useState({}); // Object for alternative comparisons per criterion
    const [results, setResults] = useState([]); // Final ranked results
    const [activeTab, setActiveTab] = useState('criteria'); // Controls the active tab (criteria, alternatives, comparisons, results)

    const [newCriterion, setNewCriterion] = useState(''); // Input for adding new criterion
    const [newAlternative, setNewAlternative] = useState(''); // Input for adding new alternative

    const [showModal, setShowModal] = useState(false); // Controls visibility of custom modal
    const [modalMessage, setModalMessage] = useState(''); // Message to display in the modal

    // State to store calculated Consistency Ratios for display
    const [criteriaConsistencyRatio, setCriteriaConsistencyRatio] = useState(0);
    const [alternativeConsistencyRatios, setAlternativeConsistencyRatios] = useState({});

    // Saaty's 9-point scale values for pairwise comparisons
    const saatyScale = [
        { value: 1, label: 'Equally Important' },
        { value: 2, label: 'Equally to Moderately Important' },
        { value: 3, label: 'Moderately Important' },
        { value: 4, label: 'Moderately to Strongly Important' },
        { value: 5, label: 'Strongly Important' },
        { value: 6, label: 'Strongly to Very Strongly Important' },
        { value: 7, label: 'Very Strongly Important' },
        { value: 8, label: 'Very Strongly to Extremely Important' },
        { value: 9, label: 'Extremely Important' },
    ];

    /**
     * Shows a custom modal with a given message.
     * @param {string} message - The message to display.
     */
    const showCustomModal = (message) => {
        setModalMessage(message);
        setShowModal(true);
    };

    /**
     * Initializes a square matrix with 1s.
     * @param {number} size - The size of the matrix (n x n).
     * @returns {number[][]} An initialized matrix.
     */
    const initializeMatrix = useCallback((size) => {
        // Creates a square matrix of a given size, initialized with 1s.
        // This represents "equally important" as the default for all comparisons.
        return Array(size).fill(null).map(() => Array(size).fill(1));
    }, []);

    /**
     * Calculates the priority vector (weights) and consistency ratio for a given matrix.
     * This function is defined using useCallback to ensure it's stable across renders.
     * Added robust checks for matrix validity to prevent TypeError.
     * @param {number[][]} matrix - The pairwise comparison matrix.
     * @param {number} n - The number of elements being compared.
     * @returns {{weights: number[], consistencyRatio: number, lambdaMax: number}} Object containing weights, consistency ratio, and lambdaMax.
     */
    const calculateAHP = useCallback((matrix, n) => {
        if (n === 0) return { weights: [], consistencyRatio: NaN, lambdaMax: NaN };
        if (n === 1) return { weights: [1], consistencyRatio: 0, lambdaMax: 1 }; // Single element has weight 1, CR 0

        // Robust check: Ensure matrix is a valid 2D array of the expected size
        if (!Array.isArray(matrix) || matrix.length !== n || (n > 0 && !Array.isArray(matrix[0]))) {
            console.error("calculateAHP received an invalid matrix structure:", matrix, "Expected size:", n);
            return { weights: Array(n).fill(NaN), consistencyRatio: NaN, lambdaMax: NaN };
        }
        // Check if all rows have the correct length
        for (let i = 0; i < n; i++) {
            if (!matrix[i] || matrix[i].length !== n) {
                console.error("calculateAHP received a non-square matrix or incorrect row length:", matrix, "Expected size:", n);
                return { weights: Array(n).fill(NaN), consistencyRatio: NaN, lambdaMax: NaN };
            }
        }


        // Step 1: Normalize the matrix (sum of columns = 1)
        const columnSums = Array(n).fill(0);
        for (let j = 0; j < n; j++) {
            for (let i = 0; i < n; i++) {
                columnSums[j] += matrix[i][j];
            }
        }

        const normalizedMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (columnSums[j] === 0) { // Avoid division by zero
                    normalizedMatrix[i][j] = 1 / n; // Handle case of zero sum column
                } else {
                    normalizedMatrix[i][j] = matrix[i][j] / columnSums[j];
                }
            }
        }

        // Step 2: Calculate the priority vector (average of rows)
        const weights = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            let rowSum = 0;
            for (let j = 0; j < n; j++) {
                rowSum += normalizedMatrix[i][j];
            }
            weights[i] = rowSum / n;
        }

        // Step 3: Calculate Lambda Max (λ_max)
        const weightedSumVector = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                weightedSumVector[i] += matrix[i][j] * weights[j];
            }
        }

        let lambdaMax = 0;
        for (let i = 0; i < n; i++) {
            if (weights[i] !== 0) {
                lambdaMax += weightedSumVector[i] / weights[i];
            }
        }
        lambdaMax /= n;

        // Step 4: Calculate Consistency Index (CI)
        const CI = n > 1 ? (lambdaMax - n) / (n - 1) : 0;

        // Step 5: Calculate Consistency Ratio (CR)
        const randomIndex = RI[n - 1];
        const consistencyRatio = randomIndex === 0 ? 0 : CI / randomIndex;

        return { weights, consistencyRatio, lambdaMax };
    }, []);

    /**
     * Effect hook to re-initialize comparison matrices when criteria or alternatives change.
     */
    useEffect(() => {
        // Update criteria comparison matrix
        setCriteriaComparisons(prevMatrix => {
            const n = criteria.length;
            if (n === 0) return [];

            const newMatrix = initializeMatrix(n);
            const prevSize = prevMatrix ? prevMatrix.length : 0;

            // Preserve existing values if possible (e.g., when adding an item)
            for (let i = 0; i < Math.min(prevSize, n); i++) {
                for (let j = 0; j < Math.min(prevSize, n); j++) {
                    if (prevMatrix[i] && prevMatrix[i][j] !== undefined) {
                        newMatrix[i][j] = prevMatrix[i][j];
                    }
                }
            }
            return newMatrix;
        });

        // Update alternative comparison matrices for each criterion
        setAlternativeComparisons(prevComparisons => {
            const newComparisons = {};
            const numAlternatives = alternatives.length;

            criteria.forEach(criterion => {
                const prevAltMatrix = prevComparisons[criterion] || [];
                if (numAlternatives === 0) {
                    newComparisons[criterion] = [];
                } else {
                    const newAltMatrix = initializeMatrix(numAlternatives);
                    const prevAltSize = prevAltMatrix.length;
                    for (let i = 0; i < Math.min(prevAltSize, numAlternatives); i++) {
                        for (let j = 0; j < Math.min(prevAltSize, numAlternatives); j++) {
                             if (prevAltMatrix[i] && prevAltMatrix[i][j] !== undefined) {
                                newAltMatrix[i][j] = prevAltMatrix[i][j];
                            }
                        }
                    }
                    newComparisons[criterion] = newAltMatrix;
                }
            });
            return newComparisons;
        });
    }, [criteria, alternatives, initializeMatrix]);

    /**
     * Effect hook to calculate and update criteria consistency ratio whenever criteriaComparisons change.
     */
    useEffect(() => {
        // FIX: Add guard clause to prevent race condition on re-render.
        // Only calculate if the matrix has been resized to match the number of criteria.
        if (criteria.length > 1 && criteriaComparisons.length === criteria.length) {
            const { consistencyRatio } = calculateAHP(criteriaComparisons, criteria.length);
            setCriteriaConsistencyRatio(consistencyRatio);
        } else {
            setCriteriaConsistencyRatio(0); // CR is 0 for 0/1 criteria or if matrix is out of sync
        }
    }, [criteriaComparisons, criteria.length, calculateAHP]);

    /**
     * Effect hook to calculate and update alternative consistency ratios whenever alternativeComparisons change.
     */
    useEffect(() => {
        const updatedAlternativeCRs = {};
        criteria.forEach(criterion => {
            const altMatrix = alternativeComparisons[criterion];
            // FIX: Add guard clause here too, checking matrix dimension against alternative count.
            if (altMatrix && alternatives.length > 1 && altMatrix.length === alternatives.length) {
                const { consistencyRatio } = calculateAHP(altMatrix, alternatives.length);
                updatedAlternativeCRs[criterion] = consistencyRatio;
            } else {
                updatedAlternativeCRs[criterion] = 0;
            }
        });
        setAlternativeConsistencyRatios(updatedAlternativeCRs);
    }, [alternativeComparisons, criteria, alternatives.length, calculateAHP]);


    /**
     * Adds a new criterion to the list.
     */
    const addCriterion = () => {
        if (newCriterion.trim() === '') {
            showCustomModal('Criterion name cannot be empty.');
            return;
        }
        if (criteria.includes(newCriterion.trim())) {
            showCustomModal('Criterion already exists.');
            return;
        }
        setCriteria([...criteria, newCriterion.trim()]);
        setNewCriterion('');
    };

    /**
     * Removes a criterion from the list.
     * @param {string} criterionToRemove - The criterion to remove.
     */
    const removeCriterion = (criterionToRemove) => {
        const newCriteria = criteria.filter(c => c !== criterionToRemove);
        setCriteria(newCriteria);
    };

    /**
     * Adds a new alternative to the list.
     */
    const addAlternative = () => {
        if (newAlternative.trim() === '') {
            showCustomModal('Alternative name cannot be empty.');
            return;
        }
        if (alternatives.includes(newAlternative.trim())) {
            showCustomModal('Alternative already exists.');
            return;
        }
        setAlternatives([...alternatives, newAlternative.trim()]);
        setNewAlternative('');
    };

    /**
     * Removes an alternative from the list.
     * @param {string} alternativeToRemove - The alternative to remove.
     */
    const removeAlternative = (alternativeToRemove) => {
        setAlternatives(alternatives.filter(a => a !== alternativeToRemove));
    };

    /**
     * Handles changes in the criteria pairwise comparison matrix.
     * @param {number} i - Row index.
     * @param {number} j - Column index.
     * @param {number} value - The comparison value.
     */
    const handleCriteriaComparisonChange = (i, j, value) => {
        const newMatrix = criteriaComparisons.map(row => [...row]);
        newMatrix[i][j] = value;
        newMatrix[j][i] = 1 / value; // Reciprocal relationship
        setCriteriaComparisons(newMatrix);
    };

    /**
     * Handles changes in the alternative pairwise comparison matrix for a specific criterion.
     * @param {string} criterion - The criterion for which comparisons are being made.
     * @param {number} i - Row index.
     * @param {number} j - Column index.
     * @param {number} value - The comparison value.
     */
    const handleAlternativeComparisonChange = (criterion, i, j, value) => {
        const newAlternativeComparisons = { ...alternativeComparisons };
        const matrix = newAlternativeComparisons[criterion].map(row => [...row]);
        matrix[i][j] = value;
        matrix[j][i] = 1 / value; // Reciprocal relationship
        newAlternativeComparisons[criterion] = matrix;
        setAlternativeComparisons(newAlternativeComparisons);
    };

    /**
     * Performs the full AHP calculation and sets the results.
     */
    const calculateOverallAHP = () => {
        if (criteria.length === 0) {
            showCustomModal('Please add at least one criterion.');
            return;
        }
        if (alternatives.length === 0) {
            showCustomModal('Please add at least one alternative.');
            return;
        }

        // Calculate criteria weights and check consistency
        const { weights: criteriaWeights, consistencyRatio: criteriaCR } = calculateAHP(criteriaComparisons, criteria.length);

        if (criteriaCR > 0.10) {
            showCustomModal(`Consistency Ratio for Criteria is ${criteriaCR.toFixed(2)}. This is considered inconsistent. Please revise your criteria comparisons.`);
            return;
        }

        // Store alternative weights for each criterion
        const alternativeWeightsByCriterion = {};
        let allAlternativesConsistent = true;

        for (const criterion of criteria) {
            const altMatrix = alternativeComparisons[criterion];
            if (!altMatrix || altMatrix.length === 0) {
                showCustomModal(`Please make comparisons for alternatives under criterion: "${criterion}".`);
                return;
            }
            const { weights: altWeights, consistencyRatio: altCR } = calculateAHP(altMatrix, alternatives.length);

            if (altCR > 0.10) {
                showCustomModal(`Consistency Ratio for Alternatives under "${criterion}" is ${altCR.toFixed(2)}. This is inconsistent. Please revise your comparisons.`);
                allAlternativesConsistent = false;
                break;
            }
            alternativeWeightsByCriterion[criterion] = altWeights;
        }

        if (!allAlternativesConsistent) {
            return; // Stop if any alternative comparison is inconsistent
        }

        // Synthesize overall scores for each alternative
        const finalScores = alternatives.map((alt, altIndex) => {
            let totalScore = 0;
            criteria.forEach((crit, critIndex) => {
                totalScore += alternativeWeightsByCriterion[crit][altIndex] * criteriaWeights[critIndex];
            });
            return { name: alt, score: totalScore };
        });

        // Sort alternatives by score in descending order
        const sortedResults = finalScores.sort((a, b) => b.score - a.score);
        setResults(sortedResults);
        setActiveTab('results'); // Switch to results tab
    };

    /**
     * Renders the pairwise comparison table for a given set of items.
     * @param {string[]} items - Array of items to compare (e.g., criteria or alternatives).
     * @param {number[][]} matrix - The comparison matrix.
     * @param {function(number, number, number): void} handleChange - Callback for value changes.
     * @param {string} type - 'criteria' or 'alternative' for unique key generation.
     * @param {string} [criterionName] - Optional, for alternative comparisons.
     * @returns {JSX.Element} The comparison table.
     */
    const renderComparisonTable = (items, matrix, handleChange, type, criterionName = '') => {
        if (!matrix || matrix.length === 0 || items.length < 2) {
            return <p className="text-gray-600">Add at least two {type === 'criteria' ? 'criteria' : 'alternatives'} to make comparisons.</p>;
        }

        return (
            <div className="overflow-x-auto rounded-lg shadow-md mb-4">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700"></th>
                            {items.map((item, index) => (
                                <th key={index} className="py-3 px-4 border-b text-center text-sm font-semibold text-gray-700">{item}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((rowItem, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="py-3 px-4 border-b text-left font-medium text-gray-800">{rowItem}</td>
                                {items.map((colItem, j) => (
                                    <td key={j} className="py-3 px-4 border-b text-center">
                                        {i === j ? (
                                            <span className="font-bold text-gray-500">1</span>
                                        ) : i < j ? (
                                            <select
                                                value={matrix[i] ? matrix[i][j] : 1}
                                                onChange={(e) => handleChange(i, j, parseFloat(e.target.value))}
                                                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                            >
                                                {saatyScale.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.value} ({option.label})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="text-gray-600">
                                                {matrix[j] && matrix[j][i] ? (1 / matrix[j][i]).toFixed(2) : 'N/A'}
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Custom Modal Component
    const Modal = ({ message, onClose }) => {
        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full transform transition-all duration-300 scale-100 opacity-100">
                    <h3 className="text-lg font-bold text-red-600 mb-4">Heads Up!</h3>
                    <p className="text-gray-700 mb-6">{message}</p>
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-inter antialiased">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 text-center">AHP Calculator</h1>
                <p className="text-gray-600 text-center mb-8">
                    Define your criteria and alternatives, make pairwise comparisons, and let the AHP algorithm rank your options.
                </p>

                {/* Tab Navigation */}
                <div className="mb-8 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('criteria')}
                            className={`${activeTab === 'criteria' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                        >
                            1. Criteria
                        </button>
                        <button
                            onClick={() => setActiveTab('alternatives')}
                            className={`${activeTab === 'alternatives' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                        >
                            2. Alternatives
                        </button>
                        <button
                            onClick={() => setActiveTab('comparisons')}
                            className={`${activeTab === 'comparisons' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                        >
                            3. Comparisons
                        </button>
                        <button
                            onClick={() => calculateOverallAHP()} // Trigger calculation when clicking Results tab
                            className={`${activeTab === 'results' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                        >
                            4. Results
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'criteria' && (
                        <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Define Criteria</h2>
                            <div className="flex mb-4">
                                <input
                                    type="text"
                                    value={newCriterion}
                                    onChange={(e) => setNewCriterion(e.target.value)}
                                    placeholder="e.g., Cost, Quality, Features"
                                    className="flex-grow p-3 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                />
                                <button
                                    onClick={addCriterion}
                                    className="bg-blue-600 text-white px-5 py-3 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                                >
                                    Add Criterion
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {criteria.length === 0 ? (
                                    <p className="text-gray-600 italic col-span-2">No criteria added yet. Start by adding some!</p>
                                ) : (
                                    criteria.map((c, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm border border-gray-200">
                                            <span className="text-gray-800 font-medium">{c}</span>
                                            <button
                                                onClick={() => removeCriterion(c)}
                                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition duration-150 ease-in-out"
                                                aria-label={`Remove ${c}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <button
                                onClick={() => setActiveTab('alternatives')}
                                className="mt-6 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out float-right"
                            >
                                Next: Define Alternatives
                            </button>
                        </div>
                    )}

                    {activeTab === 'alternatives' && (
                        <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Define Alternatives</h2>
                            <div className="flex mb-4">
                                <input
                                    type="text"
                                    value={newAlternative}
                                    onChange={(e) => setNewAlternative(e.target.value)}
                                    placeholder="e.g., Option A, Product X, Car Y"
                                    className="flex-grow p-3 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                />
                                <button
                                    onClick={addAlternative}
                                    className="bg-blue-600 text-white px-5 py-3 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                                >
                                    Add Alternative
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {alternatives.length === 0 ? (
                                    <p className="text-gray-600 italic col-span-2">No alternatives added yet. Get to it!</p>
                                ) : (
                                    alternatives.map((a, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm border border-gray-200">
                                            <span className="text-gray-800 font-medium">{a}</span>
                                            <button
                                                onClick={() => removeAlternative(a)}
                                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition duration-150 ease-in-out"
                                                aria-label={`Remove ${a}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <button
                                onClick={() => setActiveTab('criteria')}
                                className="mt-6 bg-gray-400 text-white px-6 py-3 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition duration-150 ease-in-out float-left"
                            >
                                Back: Criteria
                            </button>
                            <button
                                onClick={() => setActiveTab('comparisons')}
                                className="mt-6 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out float-right"
                            >
                                Next: Make Comparisons
                            </button>
                        </div>
                    )}

                    {activeTab === 'comparisons' && (
                        <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Make Pairwise Comparisons</h2>

                            {criteria.length < 2 && alternatives.length < 2 ? (
                                <p className="text-gray-600">You need at least two criteria and two alternatives to make meaningful comparisons. Go back and add some!</p>
                            ) : (
                                <>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-3">Compare Criteria</h3>
                                    {renderComparisonTable(criteria, criteriaComparisons, handleCriteriaComparisonChange, 'criteria')}
                                    {criteria.length > 1 && (
                                        <p className={`text-sm mt-2 p-2 rounded-md ${criteriaConsistencyRatio <= 0.10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            Criteria Consistency Ratio: <span className="font-bold">{criteriaConsistencyRatio.toFixed(2)}</span> (Ideal: ≤ 0.10)
                                        </p>
                                    )}


                                    <h3 className="text-xl font-semibold text-gray-700 mb-3 mt-8">Compare Alternatives for Each Criterion</h3>
                                    {criteria.length === 0 ? (
                                        <p className="text-gray-600 italic">No criteria defined. Cannot compare alternatives yet.</p>
                                    ) : (
                                        criteria.map((criterion, index) => (
                                            <div key={index} className="mb-6 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                                                <h4 className="text-lg font-medium text-gray-800 mb-3">Under Criterion: <span className="font-bold text-blue-600">{criterion}</span></h4>
                                                {renderComparisonTable(alternatives, alternativeComparisons[criterion] || [], (i, j, val) => handleAlternativeComparisonChange(criterion, i, j, val), 'alternative', criterion)}
                                                {alternatives.length > 1 && (
                                                    <p className={`text-sm mt-2 p-2 rounded-md ${alternativeConsistencyRatios[criterion] <= 0.10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        Consistency Ratio for {criterion}: <span className="font-bold">{alternativeConsistencyRatios[criterion]?.toFixed(2) || 'N/A'}</span> (Ideal: ≤ 0.10)
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </>
                            )}
                            <button
                                onClick={() => setActiveTab('alternatives')}
                                className="mt-6 bg-gray-400 text-white px-6 py-3 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition duration-150 ease-in-out float-left"
                            >
                                Back: Alternatives
                            </button>
                            <button
                                onClick={calculateOverallAHP}
                                className="mt-6 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out float-right"
                            >
                                Calculate Results
                            </button>
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Results & Ranking</h2>
                            {results.length === 0 ? (
                                <p className="text-gray-600">No results to display. Please complete the comparisons and click "Calculate Results".</p>
                            ) : (
                                <div className="overflow-x-auto rounded-lg shadow-md">
                                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                        <thead className="bg-blue-100">
                                            <tr>
                                                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-blue-700">Rank</th>
                                                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-blue-700">Alternative</th>
                                                <th className="py-3 px-4 border-b text-right text-sm font-semibold text-blue-700">Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((result, index) => (
                                                <tr key={index} className="hover:bg-blue-50">
                                                    <td className="py-3 px-4 border-b text-left font-bold text-blue-800">{index + 1}</td>
                                                    <td className="py-3 px-4 border-b text-left text-gray-800">{result.name}</td>
                                                    <td className="py-3 px-4 border-b text-right font-mono text-gray-800">{result.score.toFixed(4)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <button
                                onClick={() => setActiveTab('comparisons')}
                                className="mt-6 bg-gray-400 text-white px-6 py-3 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition duration-150 ease-in-out float-left"
                            >
                                Back: Comparisons
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Modal */}
            {showModal && <Modal message={modalMessage} onClose={() => setShowModal(false)} />}
        </div>
    );
};

export default App;
