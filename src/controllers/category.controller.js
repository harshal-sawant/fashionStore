/**
 * Category Controller
 * 
 * This file contains controller functions for handling category-related operations
 * including creating, retrieving, updating, and deleting categories.
 * It implements RESTful API endpoints for category management in the fashion store.
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/category.model.js";

/**
 * Creates a new category
 * 
 * @route POST /api/categories
 * @param {Object} req.body - Category data (name, description, parentCategory, slug, imageUrl)
 * @returns {Object} - Created category object
 * @throws {ApiError} - If required fields are missing or slug already exists
 */
const createCategory = asyncHandler(async (req, res) => {
    // Extract category data from request body
    const { name, description, parentCategory, slug, imageUrl } = req.body;

    // Validate required fields
    if (!name || !description || !slug) {
        throw new ApiError(400, "Name, description and slug are required");
    }

    // Check if category with same slug exists to ensure uniqueness
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
        throw new ApiError(409, "Category with this slug already exists");
    }

    // Create new category in the database
    const category = await Category.create({
        name,
        description,
        parentCategory: parentCategory || null,
        slug,
        imageUrl: imageUrl || ""
    });

    // Return success response with created category
    return res.status(201).json(
        new ApiResponse(201, category, "Category created successfully")
    );
});

/**
 * Retrieves all active categories
 * 
 * @route GET /api/categories
 * @returns {Array} - List of all active categories
 */
const getAllCategories = asyncHandler(async (req, res) => {
    // Fetch all active categories from database
    // Populate parent category details and exclude unnecessary fields
    const categories = await Category.find({ isActive: true })
        .populate("parentCategory", "name slug")
        .select("-createdAt -updatedAt -__v");

    // Return success response with categories list
    return res.status(200).json(
        new ApiResponse(200, categories, "Categories retrieved successfully")
    );
});

/**
 * Retrieves a specific category by ID
 * 
 * @route GET /api/categories/:categoryId
 * @param {String} req.params.categoryId - ID of the category to retrieve
 * @returns {Object} - Category details
 * @throws {ApiError} - If category not found
 */
const getCategoryById = asyncHandler(async (req, res) => {
    // Extract category ID from request parameters
    const { categoryId } = req.params;

    // Find category by ID and populate parent category details
    const category = await Category.findById(categoryId)
        .populate("parentCategory", "name slug")
        .select("-createdAt -updatedAt -__v");

    // Check if category exists
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // Return success response with category details
    return res.status(200).json(
        new ApiResponse(200, category, "Category retrieved successfully")
    );
});

/**
 * Updates an existing category
 * 
 * @route PUT /api/categories/:categoryId
 * @param {String} req.params.categoryId - ID of the category to update
 * @param {Object} req.body - Updated category data
 * @returns {Object} - Updated category details
 * @throws {ApiError} - If category not found or slug already exists
 */
const updateCategory = asyncHandler(async (req, res) => {
    // Extract category ID from request parameters
    const { categoryId } = req.params;
    // Extract updated fields from request body
    const { name, description, parentCategory, slug, imageUrl, isActive } = req.body;

    // Find category by ID
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // If slug is being updated, check for uniqueness
    if (slug && slug !== category.slug) {
        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            throw new ApiError(409, "Category with this slug already exists");
        }
    }

    // Update category fields if provided, otherwise keep existing values
    category.name = name || category.name;
    category.description = description || category.description;
    category.parentCategory = parentCategory || category.parentCategory;
    category.slug = slug || category.slug;
    category.imageUrl = imageUrl || category.imageUrl;
    // Use nullish coalescing to handle boolean false value correctly
    category.isActive = isActive ?? category.isActive;

    // Save updated category to database
    const updatedCategory = await category.save();

    // Return success response with updated category
    return res.status(200).json(
        new ApiResponse(200, updatedCategory, "Category updated successfully")
    );
});

/**
 * Soft deletes a category by setting isActive to false
 * 
 * @route DELETE /api/categories/:categoryId
 * @param {String} req.params.categoryId - ID of the category to delete
 * @returns {Object} - Empty object with success message
 * @throws {ApiError} - If category not found
 */
const deleteCategory = asyncHandler(async (req, res) => {
    // Extract category ID from request parameters
    const { categoryId } = req.params;

    // Find category by ID
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // Perform soft delete by setting isActive to false instead of removing from database
    // This preserves data integrity and allows for potential recovery
    category.isActive = false;
    await category.save();

    // Return success response
    return res.status(200).json(
        new ApiResponse(200, {}, "Category deleted successfully")
    );
});

/**
 * Retrieves all active subcategories of a specific parent category
 * 
 * @route GET /api/categories/:categoryId/subcategories
 * @param {String} req.params.categoryId - ID of the parent category
 * @returns {Array} - List of subcategories
 */
const getSubCategories = asyncHandler(async (req, res) => {
    // Extract parent category ID from request parameters
    const { categoryId } = req.params;

    // Find all active subcategories with the specified parent category
    const subCategories = await Category.find({ 
        parentCategory: categoryId,
        isActive: true 
    }).select("-createdAt -updatedAt -__v");

    // Return success response with subcategories list
    return res.status(200).json(
        new ApiResponse(200, subCategories, "Sub-categories retrieved successfully")
    );
});

export {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getSubCategories
};
