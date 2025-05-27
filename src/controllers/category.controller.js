import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/category.model.js";

const createCategory = asyncHandler(async (req, res) => {
    const { name, description, parentCategory, slug, imageUrl } = req.body;

    if (!name || !description || !slug) {
        throw new ApiError(400, "Name, description and slug are required");
    }

    // Check if category with same slug exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
        throw new ApiError(409, "Category with this slug already exists");
    }

    const category = await Category.create({
        name,
        description,
        parentCategory: parentCategory || null,
        slug,
        imageUrl: imageUrl || ""
    });

    return res.status(201).json(
        new ApiResponse(201, category, "Category created successfully")
    );
});

const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
        .populate("parentCategory", "name slug")
        .select("-createdAt -updatedAt -__v");

    return res.status(200).json(
        new ApiResponse(200, categories, "Categories retrieved successfully")
    );
});

const getCategoryById = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId)
        .populate("parentCategory", "name slug")
        .select("-createdAt -updatedAt -__v");

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res.status(200).json(
        new ApiResponse(200, category, "Category retrieved successfully")
    );
});

const updateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { name, description, parentCategory, slug, imageUrl, isActive } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    if (slug && slug !== category.slug) {
        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            throw new ApiError(409, "Category with this slug already exists");
        }
    }

    category.name = name || category.name;
    category.description = description || category.description;
    category.parentCategory = parentCategory || category.parentCategory;
    category.slug = slug || category.slug;
    category.imageUrl = imageUrl || category.imageUrl;
    category.isActive = isActive ?? category.isActive;

    const updatedCategory = await category.save();

    return res.status(200).json(
        new ApiResponse(200, updatedCategory, "Category updated successfully")
    );
});

const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // Soft delete by setting isActive to false
    category.isActive = false;
    await category.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Category deleted successfully")
    );
});

const getSubCategories = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const subCategories = await Category.find({ 
        parentCategory: categoryId,
        isActive: true 
    }).select("-createdAt -updatedAt -__v");

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