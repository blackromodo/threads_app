"use server"

import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { revalidatePath } from "next/cache";
import { use } from "react";

//Defines the parameters that will be used/updated (e.g., name, bio, etc.)
interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string,
}

//A function to create a Thread
export async function createThread({text, author, communityId, path}: Params){
    connectToDB(); 

    const createdThread = await Thread.create({
        text,
        author,
        community: null,
    });

    //Update user model
    await User.findByIdAndUpdate (author, {
        $push: {threads: createdThread._id}
    })

    revalidatePath(path);
}

//A function to display and update our threads on the Homepage
export async function fetchPosts(pageNumber = 1, pageSize = 20) {
    connectToDB();

//Calculate the number of posts to skip
const skipAmount = (pageNumber - 1) * pageSize;


//Fetch Posts that have no Parents (top-level threads)
const postsQuery = Thread.find({ parentId: {$in: [null, undefined]}})
.sort({ createdAt: 'desc' })
.skip(skipAmount)
.limit(pageSize)
.populate({ path: 'author', model: User })
.populate({
    path: 'children',
    populate: {
        path: 'author',
        model: User,
        select: "_id name parentId image"
    }
})

const totalPostsCount = await Thread.countDocuments({parentId: { $in: [null, undefined]} })

const posts = await postsQuery.exec();

const isNext = totalPostsCount > skipAmount + posts.length;

return { posts, isNext };

}

// A function to obtain the Id of the page that the user is on
export async function fetchThreadById(id:string) {
    connectToDB();

    try {
        const thread = await Thread.findById(id)
        .populate ({
            path: 'author',
            model: User,
            select: "_id id name image"
        })
        .populate({
            path: 'children',
            populate: [
                {
                    path: 'author',
                    model: User,
                    select: "_id id name parentId image"
                },
                {
                    path: 'children',
                    model: Thread,
                    populate: {
                        path: 'author',
                        model: User,
                        select: "_id id name parentId image"
                    }
                }
            ]
        }).exec();
        return thread;
    } catch (error: any) {
        throw new Error(`Error fetching thread: ${error.message}`);
        
    }
}

// A function to add a comment to the thread
export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string,
) {
    connectToDB();
    try {
        // Find the original thread using the ID
        const originalThread = await Thread.findById(threadId);

        if(!originalThread){
            throw new Error("Comment not found");
        }
        // Create a new thread with the comment text 
        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId,
        })

        // Save the new Thread
        const savedCommentThread = await commentThread.save();

        // Update the original thread to include the new comment
        originalThread.children.push(savedCommentThread._id);

        // Save the original Thread
        await originalThread.save();

        revalidatePath(path);

    } catch (error: any) {
        throw new Error(`Error adding a new comment to the thread: ${error.message}`);
    }
}