// "use client" is neccessary to include in order to use useRouter which is a hook. Otherwise, code will crash
"use client"

import { SignedIn } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { sidebarLinks } from "@/constants";
import Image from "next/image";
import Link from "next/link";
// "usePathname" and "useRouter" is used here to obtain the current URL that the user is on. This info can be used for other actions (see line 26 - "leftsidebar_link")
import { usePathname, useRouter } from "next/navigation";

function LeftSidebar() {

    const router = useRouter();
    const pathname = usePathname();
    const {userId} = useAuth();

    return (
        <section className="custom-scrollbar leftsidebar">
            <div className="flex w-full flex-1 flex-col gap-6 px-6">
                {sidebarLinks.map((link) => {
                    const isActive = (pathname.includes (link.route) && 
                    link.route.length > 1) || pathname === link.route;
                    
// If statement to check for and make sure the URL path is correct for the links
                    if(link.route ==='/profile') 
                    link.route = `${link.route}/${userId}`


                    return (
                        <Link 
                        href={link.route} 
                        key={link.label} 
                        className= {`leftsidebar_link ${isActive && 'bg-primary-500'}`}>
                        
                            <Image 
                                src={link.imgURL} 
                                alt={link.label}
                                width={24}
                                height={24}
                            />
                            
                            <p className="text-light-1 max-lg:hidden">{link.label}</p>  

                        </Link>
                )}
                )}
            </div>

            <div className="mt-10 px-6">
                <SignedIn>
                        <SignOutButton signOutCallback={() => 
                            router.push('/sign-in')}>
                            <div className="flex cursor-pointer gap-4 p-4">
                                <Image 
                                    src="/assets/logout.svg"
                                    alt="logout"
                                    width={24}
                                    height={24}
                                />
                                <p className="text-light-2 max-lg:hidden">Logout</p>
                            </div>
                        </SignOutButton>  
                </SignedIn>  
            </div> 
        </section>
    )
}

export default LeftSidebar;