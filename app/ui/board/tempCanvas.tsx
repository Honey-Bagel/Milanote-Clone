<Canvas boardId={"123"}>
					{/* Board Title Card */}
					<div className="mb-12">
						<h1 className="text-4xl font-bold text-white mb-2">Design System Documentation</h1>
						<p className="text-gray-400">Last updated 2 hours ago by John Doe</p>
					</div>
					
					{/* Content Grid */}
					<div className="grid grid-cols-12 gap-6">
						
						{/* Note Card */}
						<div className="col-span-3">
							<NoteCard 
								title="Typography Guidelines"
								content="Use Inter font family for all text. Maintain consistent line heights and spacing."
								timestamp="2 days ago"
								color="yellow"
							/>
						</div>
						
						{/* Image Card */}
						<div className="col-span-4">
							<ImageCard 
								src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop"
								alt="Design mockup"
								caption="Color Palette Exploration"
								timestamp="Yesterday"
							/>
						</div>
						
						{/* Task List Card */}
						<div className="col-span-3">
							<TaskListCard 
								title="To Do"
								tasks={[
									{ id: '1', text: "Update button components", completed: true },
									{ id: '2', text: "Review color accessibility", completed: false },
									{ id: '3', text: "Document spacing system", completed: false },
									{ id: '4', text: "Create icon library", completed: false }
								]}
								timestamp="4 items"
							/>
						</div>
						
						{/* Text Card */}
						<div className="col-span-5">
							<TextCard 
								title="Component Library"
								content="Our component library includes reusable UI elements designed to maintain consistency across all products. Each component follows our design principles and accessibility guidelines.

Key components include buttons, forms, cards, navigation elements, and data visualization tools."
								timestamp="3 days ago"
							/>
						</div>
						
						{/* Link Card */}
						<div className="col-span-3">
							<LinkCard 
								title="Figma Design Files"
								url="figma.com/file/abc123..."
								timestamp="1 week ago"
							/>
						</div>
						
						{/* Color Palette Card */}
						<div className="col-span-4">
							<ColorPaletteCard 
								title="Brand Colors"
								colors={['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B']}
								description="Primary color palette for all interfaces"
								timestamp="2 weeks ago"
							/>
						</div>
						
						{/* Column/Section */}
						<div className="col-span-6">
							<ColumnCard title="Research & References">
								{/* Small notes inside column */}
								<div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
									<p className="text-sm text-gray-300">Check competitor design systems for inspiration</p>
								</div>

								<div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
									<p className="text-sm text-gray-300">Material Design 3 has excellent documentation</p>
								</div>
							</ColumnCard>
						</div>
						
						{/* File/Attachment Card */}
						<div className="col-span-3">
							<FileCard 
								fileName="brand-guidelines.pdf"
								fileSize="2.4 MB"
								fileType="pdf"
								timestamp="5 days ago"
							/>
						</div>
						
					</div>
				</Canvas>